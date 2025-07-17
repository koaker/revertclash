const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const NodeManager = require('../services/nodeManager');
const ConfigProcessor = require('../services/configProcessor');

module.exports = (configManager) => {
const router = express.Router();

// 创建节点管理器实例并连接到ConfigManager
const nodeManager = new NodeManager();
const configProcessor = new ConfigProcessor(nodeManager);

// 初始化节点管理器与ConfigManager的连接
async function initNodeManagerConnection() {
    if (!configManager) {
        console.error('ConfigManager 未提供，节点管理器无法初始化。');
        // 可以在这里抛出错误，让应用启动失败，以便及早发现问题
        throw new Error('ConfigManager is required for NodeManager initialization.');
    }
    try {
        // 设置ConfigManager引用
        nodeManager.setConfigManager(configManager);
        
        // 首次加载节点数据
        await nodeManager.refreshNodesFromConfigManager();
        
        console.log('节点管理器与ConfigManager连接成功，共加载节点:', nodeManager.getNodes().length);
    } catch (err) {
        console.error('节点管理器连接ConfigManager失败:', err.message);
        // 启动时失败，这是一个严重问题，直接抛出错误
        throw err;
    }
}

// 启动时初始化连接
initNodeManagerConnection();

// ========== 节点查询API ==========

// 获取所有节点列表
router.get('/', async (req, res) => {
    try {
        let nodes = [];
        let dataSource = 'unknown';
        
        // 尝试从ConfigManager刷新最新数据
        try {
            if (nodeManager.configManager) {
                await nodeManager.refreshNodesFromConfigManager();
                nodes = nodeManager.getNodes();
                dataSource = 'ConfigManager';
                console.log(`[节点API] 从ConfigManager获取到 ${nodes.length} 个节点`);
            } else {
                console.warn('[节点API] ConfigManager未连接，尝试其他数据源');
                throw new Error('ConfigManager未连接');
            }
        } catch (refreshErr) {
            console.warn('[节点API] ConfigManager刷新失败，尝试备用方案:', refreshErr.message);
            
            // 备用方案1: 使用现有缓存数据
            nodes = nodeManager.getNodes();
            if (nodes.length > 0) {
                dataSource = 'cached';
                console.log(`[节点API] 使用缓存数据，共 ${nodes.length} 个节点`);
            } else {
                // 备用方案2: 尝试从文件直接解析
                try {
                    await fallbackToLegacyMode();
                    nodes = nodeManager.getNodes();
                    dataSource = 'legacy';
                    console.log(`[节点API] 使用兼容模式，共 ${nodes.length} 个节点`);
                } catch (legacyErr) {
                    console.error('[节点API] 兼容模式也失败:', legacyErr.message);
                    // 返回空数组，但不报错
                    nodes = [];
                    dataSource = 'empty';
                }
            }
        }
        
        // 确保返回的数据格式符合前端期望
        const formattedNodes = nodes.map(node => ({
            name: node.name || '未知节点',
            type: node.type || 'unknown',
            server: node.server || '未知',
            port: node.port || 0,
            selected: node.selected || false,
            
            // 新增字段（向后兼容）
            source: node.source || 'unknown',
            id: node.id || `fallback-${node.name}`,
            version: node.version || 1,
            updateTime: node.updateTime || new Date().toISOString()
        }));
        
        res.json({
            success: true,
            nodes: formattedNodes,
            metadata: {
                total: formattedNodes.length,
                dataSource: dataSource,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (err) {
        console.error('[节点API] 获取节点列表失败:', err.message);
        res.status(500).json({ 
            success: false,
            error: err.message,
            nodes: [],
            metadata: {
                total: 0,
                dataSource: 'error',
                timestamp: new Date().toISOString()
            }
        });
    }
});

// 获取选中的节点
router.get('/selected', async (req, res) => {
    try {
        const selectedNodes = nodeManager.getSelectedNodes();
        res.json(selectedNodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取节点详细信息
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const nodeDetails = nodeManager.getNodeDetails(name);
        
        if (!nodeDetails) {
            return res.status(404).json({ error: '节点不存在' });
        }
        
        res.json(nodeDetails);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取节点的ProxyNode结构体信息
router.get('/:name/struct', async (req, res) => {
    try {
        const { name } = req.params;
        const proxyNode = nodeManager.getProxyNode(name);
        
        if (!proxyNode) {
            return res.status(404).json({ error: '节点不存在' });
        }
        
        // 返回结构体的详细信息
        res.json({
            summary: proxyNode.getSummary(),
            clashConfig: proxyNode.toClashConfig(),
            metadata: {
                id: proxyNode.id,
                source: proxyNode.source,
                version: proxyNode.version,
                createTime: proxyNode.createTime,
                updateTime: proxyNode.updateTime
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 节点操作API ==========

// 更新节点选择状态
router.post('/select', async (req, res) => {
    try {
        const { nodeName } = req.body;
        
        if (!nodeName) {
            return res.status(400).json({ error: '节点名称是必需的' });
        }
        
        const isSelected = nodeManager.toggleNode(nodeName);
        res.json({ 
            success: true, 
            nodeName, 
            selected: isSelected 
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 批量选择节点
router.post('/select-multiple', async (req, res) => {
    try {
        const { nodeNames } = req.body;
        
        if (!nodeNames || !Array.isArray(nodeNames)) {
            return res.status(400).json({ error: '节点名称数组是必需的' });
        }
        
        nodeManager.selectNodes(nodeNames);
        res.json({ success: true, count: nodeNames.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 批量取消选择节点
router.post('/deselect-multiple', async (req, res) => {
    try {
        const { nodeNames } = req.body;
        
        if (!nodeNames || !Array.isArray(nodeNames)) {
            return res.status(400).json({ error: '节点名称数组是必需的' });
        }
        
        nodeManager.deselectNodes(nodeNames);
        res.json({ success: true, count: nodeNames.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 批量取消选择节点
router.post('/deselect-multiple', async (req, res) => {
    try {
        const { nodeNames } = req.body;
        
        if (!nodeNames || !Array.isArray(nodeNames)) {
            return res.status(400).json({ error: '节点名称数组是必需的' });
        }
        
        nodeManager.deselectNodes(nodeNames);
        res.json({ success: true, count: nodeNames.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 全选所有节点
router.post('/select-all', async (req, res) => {
    try {
        nodeManager.selectAll();
        const totalCount = nodeManager.getNodes().length;
        res.json({ success: true, count: totalCount });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 取消选择所有节点
router.post('/deselect-all', async (req, res) => {
    try {
        nodeManager.deselectAll();
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ========== 节点筛选和搜索API ==========

// 按类型筛选节点
router.get('/filter/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const nodes = nodeManager.filterByType(type);
        res.json(nodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 按配置源筛选节点
router.get('/filter/source/:source', async (req, res) => {
    try {
        const { source } = req.params;
        const nodes = nodeManager.filterBySource(source);
        res.json(nodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 按名称搜索节点
router.get('/search/:keyword', async (req, res) => {
    try {
        const { keyword } = req.params;
        const nodes = nodeManager.searchByName(keyword);
        res.json(nodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 数据管理API ==========

// 重新从ConfigManager加载节点数据
router.post('/reload', async (req, res) => {
    try {
        await nodeManager.refreshNodesFromConfigManager();
        const status = nodeManager.getManagerStatus();
        
        res.json({ 
            success: true, 
            message: '节点数据重新加载成功',
            status: status
        });
    } catch (err) {
        console.error('重新加载节点数据失败:', err.message);
        
        // 如果ConfigManager刷新失败，尝试兼容模式
        try {
            await fallbackToLegacyMode();
            res.json({ 
                success: true, 
                message: '节点数据已从兼容模式重新加载',
                count: nodeManager.getNodes().length,
                mode: 'legacy'
            });
        } catch (fallbackErr) {
            res.status(500).json({ error: fallbackErr.message });
        }
    }
});

// 获取节点管理器状态
router.get('/manager/status', async (req, res) => {
    try {
        const status = nodeManager.getManagerStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取配置源统计信息
router.get('/sources/stats', async (req, res) => {
    try {
        const sourceStats = nodeManager.getSourceStats();
        res.json(sourceStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 配置生成API ==========

// 获取选中节点的配置
router.get('/config/selected', async (req, res) => {
    try {
        const config = await configProcessor.generateSelectedConfig();
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'attachment; filename="selected-config.yaml"');
        res.send(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取处理后的选中节点配置
router.get('/config/processed', async (req, res) => {
    try {
        const config = await configProcessor.processSelectedConfig();
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'attachment; filename="processed-selected-config.yaml"');
        res.send(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 使用选中的ProxyNode结构体生成配置
router.get('/config/selected-struct', async (req, res) => {
    try {
        const selectedProxyNodes = nodeManager.getSelectedProxyNodes();
        
        if (selectedProxyNodes.length === 0) {
            return res.status(400).json({ error: '没有选中的节点' });
        }
        
        // 使用ProxyNode结构体生成配置
        const baseConfig = {
            port: 7890,
            'socks-port': 7891,
            'allow-lan': true,
            mode: 'rule',
            'log-level': 'info',
            proxies: selectedProxyNodes.map(node => node.toClashConfig()),
            'proxy-groups': [
                {
                    name: '🚀 节点选择',
                    type: 'select',
                    proxies: selectedProxyNodes.map(node => node.getDisplayName())
                }
            ],
            rules: ['MATCH,DIRECT']
        };
        
        const YAML = require('yaml');
        const yamlConfig = YAML.stringify(baseConfig);
        
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'attachment; filename="selected-struct-config.yaml"');
        res.send(yamlConfig);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 导出选中节点的协议链接
router.post('/export-links', async (req, res) => {
    try {
        const { nodeNames } = req.body;
        
        if (!nodeNames || !Array.isArray(nodeNames)) {
            return res.status(400).json({ error: '节点名称数组是必需的' });
        }
        
        const links = [];
        const errors = [];
        
        for (const nodeName of nodeNames) {
            try {
                const proxyNode = nodeManager.getProxyNode(nodeName);
                if (proxyNode && typeof proxyNode.toUri === 'function') {
                    const uri = proxyNode.toUri();
                    if (uri) {
                        links.push({
                            name: nodeName,
                            uri: uri,
                            type: proxyNode.type
                        });
                    } else {
                        errors.push({
                            name: nodeName,
                            error: '无法生成协议链接'
                        });
                    }
                } else {
                    // 回退到兼容模式，使用转换器
                    const nodeDetails = nodeManager.getNodeDetails(nodeName);
                    if (nodeDetails) {
                        const { clashToUri } = require('../converters');
                        const uri = clashToUri(nodeDetails, nodeDetails.type);
                        if (uri) {
                            links.push({
                                name: nodeName,
                                uri: uri,
                                type: nodeDetails.type
                            });
                        } else {
                            errors.push({
                                name: nodeName,
                                error: '转换协议链接失败'
                            });
                        }
                    } else {
                        errors.push({
                            name: nodeName,
                            error: '节点不存在'
                        });
                    }
                }
            } catch (err) {
                errors.push({
                    name: nodeName,
                    error: err.message
                });
            }
        }
        
        res.json({
            success: true,
            links,
            errors,
            total: nodeNames.length,
            exported: links.length,
            failed: errors.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
}