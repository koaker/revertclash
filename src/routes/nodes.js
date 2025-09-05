const express = require('express');
const NodeManager = require('../services/nodeManager');
const ConfigManager = require('../managers/ConfigManager');
const UrlManager = require('../managers/UrlManager');
const UserContentManager =require('../managers/UserContentManager');
const { SourceType } = require('../models');

module.exports = () => {
const router = express.Router();

// ========== 节点查询API ==========

// 获取所有节点列表
router.get('/', async (req, res) => {
    try {
        const localNodeManager = new NodeManager(); 

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
        await localNodeManager.refreshNodes(sources);
        const nodes = localNodeManager.getNodes();
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


});


// ========== 配置生成API ==========

// 新增：无状态配置生成 API
router.post('/config/generate', async (req, res) => {
    try {
        const { nodes, processed = true } = req.body; // 从请求体获取节点和处理标志

        if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
            return res.status(400).json({ error: '请求体中必须包含有效的节点数组' });
        }

        // 1. 将前端传来的节点对象转换为 YAML 字符串
        // 注意：这里假设前端传来的就是符合Clash配置格式的节点对象
        const nodesFromFrontend = req.body.nodes; // 这是一个JS对象数组
        const YAML = require('yaml');
        const proxiesYaml = YAML.stringify({ proxies: nodesFromFrontend }); // 在这里才转换为YAML

        // 2. 构造 ConfigManager 需要的 sources 格式
        const sources = [{
            name: 'frontend-selection',
            type: SourceType.MANUAL,
            data: proxiesYaml
        }];

        // 3. 创建实例并处理
        const configManager = new ConfigManager();
        const result = await configManager.process(sources);

        if (!result || !result.success) {
            throw new Error('使用 ConfigManager 生成配置失败');
        }

        // 4. 根据 processed 标志决定返回哪个配置
        const configContent = processed ? result.processedConfig : result.mergedConfig;
        const filename = processed ? 'processed-config.yaml' : 'selected-config.yaml';

        // 5. 发送配置
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(configContent);

    } catch (err) {
        console.error('[API /config/generate] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 替换旧的 /export-links 接口
router.post('/export-links', async (req, res) => {
    try {
        const { nodes } = req.body; // 从请求体接收完整的节点对象数组
        
        if (!nodes || !Array.isArray(nodes)) {
            return res.status(400).json({ error: '请求体中必须包含有效的节点数组' });
        }
        
        const { clashToUri } = require('../converters'); // 在循环外引入转换器
        const links = [];
        const errors = [];
        
        for (const node of nodes) {
            try {
                // 直接使用转换器，不再需要 if/else 判断
                const uri = clashToUri(node, node.type);
                if (uri) {
                    links.push({ name: node.name, uri: uri, type: node.type });
                } else {
                    errors.push({ name: node.name, error: '转换协议链接失败' });
                }
            } catch (err) {
                errors.push({ name: node.name, error: err.message });
            }
        }
        
        res.json({
            success: true,
            links,
            errors,
            total: nodes.length,
            exported: links.length,
            failed: errors.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

return router
}