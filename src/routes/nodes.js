const express = require('express');
const NodeManager = require('../services/nodeManager');
const ConfigManager = require('../managers/ConfigManager');
const UrlManager = require('../managers/UrlManager');
const UserContentManager =require('../managers/UserContentManager');
const { SourceType } = require('../models');

module.exports = () => {
const router = express.Router();

// 创建节点管理器实例并连接到ConfigManager
const nodeManager = new NodeManager();

// ========== 节点查询API ==========

// 获取所有节点列表
router.get('/', async (req, res) => {
    try {
        console.log('[节点API] 获取所有节点列表');
        const userId = req.user.id;

        const urlSourcesData = await UrlManager.getUrlsByUserId(userId);
        const customConfigSourcesData = await UserContentManager.getUserCustomConfigs(userId);

        const sources = [];
        urlSourcesData.forEach(s => {
            sources.push({ name: s.name, type: SourceType.URL, data: s.url });
        });
        customConfigSourcesData.forEach(s => {
            sources.push({ name: s.name, type: SourceType.MANUAL, data: s.config });
        });

        console.log(`共找到 ${sources.length} 个数据源`);
        await nodeManager.refreshNodes(sources);
        const nodes = nodeManager.getNodes();
        let dataSource = 'live';

        res.json({
            success: true,
            nodes: nodes,
            metadata: {
                total: nodes.length,
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
        });
    }


}); // 结束节点查询API

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
        const selectedProxyNodes = nodeManager.getSelectedProxyNodes();

        if (selectedProxyNodes.length === 0) {
            return res.status(400).send('没有选中任何节点');
        }

        const YAML = require('yaml');
        const proxiesYaml = YAML.stringify({
            proxies: selectedProxyNodes.map(node => node.toClashConfig())
        });

        const sources = [{
            name: 'selected-nodes',
            type: 'MANUAL',
            data: proxiesYaml
        }];

        const configManager = new ConfigManager();
        const result = await configManager.process(sources);

        if (!result || !result.success) {
            throw new Error('使用 ConfigManager 生成配置失败');
        }

        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'attachment; filename="selected-config.yaml"');
        res.send(result.mergedConfig); // 注意：这里是 mergedConfig

    } catch (err) {
        console.error('[API /config/selected] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 获取处理后的选中节点配置
router.get('/config/processed', async (req, res) => {
    try {
        // 1. 获取选中的节点对象
        const selectedProxyNodes = nodeManager.getSelectedProxyNodes();

        if (selectedProxyNodes.length === 0) {
            return res.status(400).send('没有选中任何节点');
        }

        // 2. 将节点对象转换为 YAML 字符串
        const YAML = require('yaml');
        const proxiesYaml = YAML.stringify({
            proxies: selectedProxyNodes.map(node => node.toClashConfig())
        });

        // 3. 构造 ConfigManager 需要的 sources 格式
        const sources = [{
            name: 'selected-nodes',
            type: 'MANUAL', // SourceType.MANUAL
            data: proxiesYaml
        }];

        // 4. 创建实例并处理
        const configManager = new ConfigManager();
        const result = await configManager.process(sources);

        if (!result || !result.success) {
            throw new Error('使用 ConfigManager 生成配置失败');
        }

        // 5. 发送处理后的配置
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', 'attachment; filename="processed-selected-config.yaml"');
        res.send(result.processedConfig); // 注意：这里是 processedConfig

    } catch (err) {
        console.error('[API /config/processed] Error:', err);
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

return router
}