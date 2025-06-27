const express = require('express');
const { getConfigManager, getSystemStatus, getHealthReport, getNodeStatistics } = require('../config');

const router = express.Router();

/**
 * 新架构的配置管理API
 * 暴露重构后的ConfigManager功能
 */

// 获取配置管理器状态
router.get('/manager/status', async (req, res) => {
    try {
        const status = getSystemStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取健康状态报告
router.get('/manager/health', async (req, res) => {
    try {
        const health = await getHealthReport();
        res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取节点统计信息
router.get('/manager/nodes/stats', async (req, res) => {
    try {
        const stats = getNodeStatistics();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取配置源列表
router.get('/manager/sources', async (req, res) => {
    try {
        const configManager = getConfigManager();
        const sources = configManager.sourceManager.getAllSources();
        
        const sourceList = sources.map(source => ({
            id: source.id,
            type: source.type,
            status: source.status,
            enabled: source.metadata.enabled,
            nodeCount: source.nodeCount,
            lastUpdate: source.lastUpdate,
            description: source.metadata.description
        }));
        
        res.json({
            success: true,
            data: {
                total: sourceList.length,
                sources: sourceList
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取指定配置源的详细信息
router.get('/manager/sources/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;
        const configManager = getConfigManager();
        const source = configManager.sourceManager.getSource(sourceId);
        
        if (!source) {
            return res.status(404).json({
                success: false,
                error: `配置源 ${sourceId} 不存在`
            });
        }
        
        const sourceInfo = {
            ...source.getStats(),
            nodes: source.getActiveNodes().map(node => node.getSummary())
        };
        
        res.json({
            success: true,
            data: sourceInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 手动更新指定配置源
router.post('/manager/sources/:sourceId/update', async (req, res) => {
    try {
        const { sourceId } = req.params;
        const configManager = getConfigManager();
        
        const result = await configManager.sourceManager.updateSource(sourceId);
        
        res.json({
            success: true,
            data: result,
            message: `配置源 ${sourceId} 更新完成`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启用/禁用配置源
router.post('/manager/sources/:sourceId/toggle', async (req, res) => {
    try {
        const { sourceId } = req.params;
        const { enabled } = req.body;
        const configManager = getConfigManager();
        
        const success = configManager.sourceManager.setSourceEnabled(sourceId, enabled);
        
        if (success) {
            res.json({
                success: true,
                message: `配置源 ${sourceId} 已${enabled ? '启用' : '禁用'}`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: `配置源 ${sourceId} 不存在`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取聚合器统计信息
router.get('/manager/aggregator/stats', async (req, res) => {
    try {
        const configManager = getConfigManager();
        const stats = configManager.nodeAggregator.getStats();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 获取冲突解决器统计信息
router.get('/manager/conflicts/stats', async (req, res) => {
    try {
        const configManager = getConfigManager();
        const conflictResolver = configManager.nodeAggregator.getConflictResolver();
        const stats = conflictResolver.getStats();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 重置统计信息
router.post('/manager/stats/reset', async (req, res) => {
    try {
        const configManager = getConfigManager();
        
        // 重置聚合器统计
        configManager.nodeAggregator.resetStats();
        
        res.json({
            success: true,
            message: '统计信息已重置',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 