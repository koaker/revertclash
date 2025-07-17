const express = require('express');
const router = express.Router();

/**
 * 新架构的配置管理API
 * 暴露重构后的ConfigManager功能
 */
// 模块导出一个接收 configManager 实例的函数
module.exports = (configManager) => {

    // 获取配置管理器状态
    router.get('/manager/status', (req, res) => {
        const status = configManager.getSystemStatus();
        res.json({ success: true, data: status });
    });

    // 获取健康状态报告
    router.get('/manager/health', (req, res) => {
        const health = configManager.getHealthReport();
        res.json({ success: true, data: health });
    });

    // 获取节点统计信息
    router.get('/manager/nodes/stats', (req, res) => {
        const stats = configManager.getNodeStatistics();
        res.json({ success: true, data: { nodeStats: stats } });
    });

    // 获取配置源列表
    router.get('/manager/sources', (req, res) => {
        const sources = configManager.sourceManager.getAllSources().map(s => s.getStats());
        res.json({ success: true, data: sources });
    });

    // 手动更新指定配置源
    router.post('/manager/sources/:sourceId/update', async (req, res) => {
        try {
            const { sourceId } = req.params;
            const result = await configManager.sourceManager.updateSource(sourceId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};