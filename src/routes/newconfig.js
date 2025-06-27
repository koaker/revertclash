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
        const configManager = getConfigManager();
        const stats = configManager.getNodeStatistics();
        
        // 获取额外的节点管理器状态信息
        const { getNodeManager } = require('../config');
        const nodeManager = getNodeManager();
        
        let managerStats = {};
        if (nodeManager) {
            managerStats = nodeManager.getManagerStatus();
        }
        
        res.json({
            success: true,
            data: {
                nodeStats: stats,
                managerStats: managerStats,
                dataSource: 'ConfigManager + NodeManager'
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

// 获取配置源列表
router.get('/manager/sources', async (req, res) => {
    try {
        const configManager = getConfigManager();
        const sources = configManager.sourceManager.getAllSources();
        
        res.json({
            success: true,
            data: sources,
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

// 系统诊断API
router.get('/manager/diagnosis', async (req, res) => {
    try {
        const { getConfigManager, getNodeManager } = require('../config');
        
        const configManager = getConfigManager();
        const nodeManager = getNodeManager();
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            systemStatus: {
                configManager: {
                    exists: !!configManager,
                    initialized: configManager ? configManager.getStatus().initialized : false
                },
                nodeManager: {
                    exists: !!nodeManager,
                    connectedToConfigManager: nodeManager ? !!nodeManager.configManager : false
                }
            },
            dataStatus: {},
            recommendations: []
        };
        
        // 检查数据状态
        if (configManager) {
            try {
                const nodeStats = configManager.getNodeStatistics();
                diagnosis.dataStatus.configManager = {
                    totalNodes: nodeStats.total,
                    nodesByType: nodeStats.byType,
                    nodesBySource: nodeStats.bySource
                };
            } catch (err) {
                diagnosis.dataStatus.configManager = {
                    error: err.message
                };
            }
        }
        
        if (nodeManager) {
            try {
                const managerStatus = nodeManager.getManagerStatus();
                diagnosis.dataStatus.nodeManager = managerStatus;
            } catch (err) {
                diagnosis.dataStatus.nodeManager = {
                    error: err.message
                };
            }
        }
        
        // 生成建议
        if (!configManager) {
            diagnosis.recommendations.push('ConfigManager未初始化，请检查系统启动流程');
        }
        
        if (!nodeManager) {
            diagnosis.recommendations.push('NodeManager未初始化，请检查系统启动流程');
        }
        
        if (nodeManager && !nodeManager.configManager) {
            diagnosis.recommendations.push('NodeManager未连接到ConfigManager，请检查连接逻辑');
        }
        
        if (diagnosis.dataStatus.nodeManager?.totalNodes === 0) {
            diagnosis.recommendations.push('当前无节点数据，请检查配置源或手动触发配置更新');
        }
        
        res.json({
            success: true,
            data: diagnosis
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            data: {
                timestamp: new Date().toISOString(),
                systemStatus: { error: '无法获取系统状态' }
            }
        });
    }
});

// 强制重新初始化系统
router.post('/manager/reinitialize', async (req, res) => {
    try {
        const { getConfigManager, initializeNodeManager, processConfigs } = require('../config');
        
        console.log('[诊断API] 开始强制重新初始化...');
        
        // 重新初始化NodeManager
        const nodeManager = await initializeNodeManager();
        console.log('[诊断API] NodeManager重新初始化完成');
        
        // 强制处理配置
        await processConfigs();
        console.log('[诊断API] 配置处理完成');
        
        // 获取最新状态
        const finalStatus = nodeManager.getManagerStatus();
        
        res.json({
            success: true,
            message: '系统重新初始化完成',
            data: {
                nodeCount: finalStatus.totalNodes,
                configSources: finalStatus.configSources,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[诊断API] 重新初始化失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 强制同步节点数据（测试API）
router.post('/manager/sync-nodes', async (req, res) => {
    try {
        const { getConfigManager, getNodeManager } = require('../config');
        
        console.log('[同步API] 开始强制同步节点数据...');
        
        const configManager = getConfigManager();
        const nodeManager = getNodeManager();
        
        if (!configManager) {
            return res.status(500).json({
                success: false,
                error: 'ConfigManager未初始化'
            });
        }
        
        if (!nodeManager) {
            return res.status(500).json({
                success: false,
                error: 'NodeManager未初始化'
            });
        }
        
        // 步骤1: 强制处理配置
        console.log('[同步API] 步骤1: 强制处理配置...');
        const processResult = await configManager.processConfigs();
        console.log('[同步API] 配置处理结果:', {
            成功: processResult.success,
            节点总数: processResult.nodes.total,
            配置源总数: processResult.sources.total
        });
        
        // 步骤2: 检查聚合器状态
        console.log('[同步API] 步骤2: 检查聚合器状态...');
        const aggregatedNodes = configManager.nodeAggregator.getAggregatedNodes();
        const sourceNodes = configManager.nodeAggregator.getNodesBySource();
        console.log('[同步API] 聚合器状态:', {
            聚合节点数: aggregatedNodes.length,
            配置源数: sourceNodes.size
        });
        
        // 步骤3: 强制刷新NodeManager
        console.log('[同步API] 步骤3: 强制刷新NodeManager...');
        const refreshResult = await nodeManager.refreshNodesFromConfigManager();
        console.log('[同步API] NodeManager刷新结果:', {
            节点数: refreshResult.length
        });
        
        // 步骤4: 获取最终状态
        const finalStatus = nodeManager.getManagerStatus();
        
        res.json({
            success: true,
            message: '节点数据同步完成',
            data: {
                processResult: {
                    success: processResult.success,
                    totalNodes: processResult.nodes.total,
                    totalSources: processResult.sources.total
                },
                aggregatorStatus: {
                    aggregatedNodes: aggregatedNodes.length,
                    sourcesWithNodes: sourceNodes.size
                },
                nodeManagerStatus: finalStatus,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[同步API] 同步失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router; 