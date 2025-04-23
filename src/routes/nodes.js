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

module.exports = router;
