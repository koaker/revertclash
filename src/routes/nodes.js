const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const NodeManager = require('../services/nodeManager');
const ConfigProcessor = require('../services/configProcessor');
const { OUTPUT_FILE } = require('../config');

const router = express.Router();
const nodeManager = new NodeManager();
const configProcessor = new ConfigProcessor(nodeManager);

// 初始化节点管理器
async function initNodeManager() {
    try {
        // 读取当前的配置文件
        // 直接使用OUTPUT_FILE，因为它已经是绝对路径
        const configContent = await fs.readFile(OUTPUT_FILE, 'utf8');
        await nodeManager.parseNodes(configContent);
        console.log('节点管理器初始化完成，共加载节点:', nodeManager.getNodes().length);
    } catch (err) {
        console.error('初始化节点管理器失败:', err.message);
    }
}

// 启动时初始化
initNodeManager();

// 获取所有节点列表
router.get('/', async (req, res) => {
    try {
        const nodes = nodeManager.getNodes();
        res.json(nodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.json({ success: true });
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
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 全选所有节点
router.post('/select-all', async (req, res) => {
    try {
        nodeManager.selectAll();
        res.json({ success: true });
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

// 重新解析配置文件中的节点
router.post('/reload', async (req, res) => {
    try {
        await initNodeManager();
        res.json({ 
            success: true, 
            message: '节点重新加载成功',
            count: nodeManager.getNodes().length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// 导出选中节点的协议链接
router.post('/export-links', async (req, res) => {
    try {
        const { nodeNames } = req.body;

        if (!nodeNames || !Array.isArray(nodeNames) || nodeNames.length === 0) {
            return res.status(400).json({ error: '需要提供有效的节点名称数组' });
        }

        // 引入转换器
        const { clashToUri } = require('../converters');

        const links = [];
        const errors = [];

        for (const nodeName of nodeNames) {
            const nodeDetails = nodeManager.getNodeDetails(nodeName);
            if (!nodeDetails) {
                errors.push(`节点 "${nodeName}" 未找到`);
                continue; // 跳过未找到的节点
            }

            try {
                // 尝试将节点配置转换为URI
                // 节点类型通常存储在 nodeDetails.type 中
                const uri = clashToUri(nodeDetails, nodeDetails.type);
                if (uri) {
                    links.push(uri);
                } else {
                    // 如果转换失败或不支持该类型
                    errors.push(`节点 "${nodeName}" (类型: ${nodeDetails.type}) 无法转换为链接或不受支持`);
                }
            } catch (convertError) {
                console.error(`转换节点 "${nodeName}" 时出错:`, convertError);
                errors.push(`转换节点 "${nodeName}" 时出错: ${convertError.message}`);
            }
        }

        if (links.length === 0 && errors.length > 0) {
            // 如果所有节点都转换失败
            return res.status(400).json({ error: '所有选定节点都无法转换为链接', details: errors });
        }

        // 将链接用换行符连接
        const linksText = links.join('\n');

        // 设置响应头为纯文本
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(linksText);

        // 如果有部分错误，可以在日志中记录或通过其他方式通知
        if (errors.length > 0) {
            console.warn('导出链接时遇到以下错误:', errors);
            // 也可以考虑在响应头中添加警告信息，但这取决于具体需求
            // res.setHeader('X-Export-Warnings', JSON.stringify(errors));
        }

    } catch (err) {
        console.error('导出节点链接时发生错误:', err);
        res.status(500).json({ error: '导出链接时发生内部服务器错误', details: err.message });
    }
});
module.exports = router;
