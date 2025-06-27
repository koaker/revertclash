const EventEmitter = require('events');
const { ConfigSource, SourceType, SourceStatus } = require('../models');
const ContentFetcher = require('../services/ContentFetcher');
const parserManager = require('../subscription/parserManager');

/**
 * 配置源管理器
 * 负责管理所有配置源的生命周期
 */
class ConfigSourceManager extends EventEmitter {
    constructor() {
        super();
        
        // 配置源存储
        this.sources = new Map();          // sourceId -> ConfigSource
        this.nodeIndex = new Map();        // nodeId -> ProxyNode (全局节点索引)
        
        // 服务依赖
        this.contentFetcher = new ContentFetcher();
        
        // 状态管理
        this.isProcessing = false;
        this.lastGlobalUpdate = null;
        
        // 统计信息
        this.stats = {
            totalSources: 0,
            activeSources: 0,
            totalNodes: 0,
            activeNodes: 0,
            lastUpdate: null,
            updateCount: 0,
            errorCount: 0
        };
    }
    
    /**
     * 注册配置源
     * @param {string} sourceId - 配置源ID
     * @param {string} type - 配置源类型
     * @param {object} config - 配置源配置
     * @returns {Promise<ConfigSource>} - 配置源对象
     */
    async registerSource(sourceId, type, config) {
        if (this.sources.has(sourceId)) {
            console.warn(`配置源 ${sourceId} 已存在，跳过注册`);
            return this.sources.get(sourceId);
        }
        
        // 验证配置源类型和配置
        this.validateSourceConfig(type, config);
        
        // 创建配置源对象
        const source = new ConfigSource(sourceId, type, config);
        this.sources.set(sourceId, source);
        
        console.log(`注册配置源: ${sourceId} (类型: ${type})`);
        
        // 更新统计信息
        this.updateStats();
        
        // 触发事件
        this.emit('sourceRegistered', source);
        
        return source;
    }
    
    /**
     * 注销配置源
     * @param {string} sourceId - 配置源ID
     * @returns {Promise<boolean>} - 是否成功注销
     */
    async unregisterSource(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {
            return false;
        }
        
        // 从全局节点索引中移除该源的所有节点
        this.removeSourceFromNodeIndex(sourceId);
        
        // 移除配置源
        this.sources.delete(sourceId);
        
        console.log(`注销配置源: ${sourceId}`);
        
        // 更新统计信息
        this.updateStats();
        
        // 触发事件
        this.emit('sourceUnregistered', sourceId, source);
        
        return true;
    }
    
    /**
     * 更新单个配置源
     * @param {string} sourceId - 配置源ID
     * @returns {Promise<object>} - 更新结果
     */
    async updateSource(sourceId) {
        const source = this.sources.get(sourceId);
        if (!source) {
            throw new Error(`配置源 ${sourceId} 不存在`);
        }
        
        if (!source.metadata.enabled) {
            console.log(`配置源 ${sourceId} 已禁用，跳过更新`);
            return { skipped: true, reason: 'disabled' };
        }
        
        console.log(`开始更新配置源: ${sourceId}`);
        
        try {
            // 获取内容
            const fetchResult = await this.contentFetcher.fetchContent(source);
            
            if (!fetchResult.success) {
                throw new Error(fetchResult.error || '获取内容失败');
            }
            
            // 更新配置源内容
            const updateResult = await source.updateContent(fetchResult.content, parserManager);
            
            // 更新全局节点索引
            if (updateResult.changed) {
                this.updateNodeIndex(sourceId, updateResult.nodes);
                
                console.log(`配置源 ${sourceId} 更新完成: ${updateResult.nodeCount} 个节点`);
                
                // 触发变更事件
                this.emit('sourceUpdated', sourceId, updateResult);
            } else {
                console.log(`配置源 ${sourceId} 内容未发生变化`);
            }
            
            // 更新统计信息
            this.updateStats();
            
            return {
                success: true,
                changed: updateResult.changed,
                nodeCount: updateResult.nodeCount,
                source: fetchResult.source,
                fromCache: fetchResult.fromCache
            };
            
        } catch (error) {
            console.error(`更新配置源失败: ${sourceId} - ${error.message}`);
            
            // 更新错误统计
            this.stats.errorCount += 1;
            
            // 触发错误事件
            this.emit('sourceError', sourceId, error);
            
            throw error;
        }
    }
    
    /**
     * 批量更新所有配置源
     * @param {object} options - 更新选项
     * @returns {Promise<Map>} - 更新结果映射
     */
    async updateAllSources(options = {}) {
        if (this.isProcessing) {
            throw new Error('配置源更新正在进行中');
        }
        
        this.isProcessing = true;
        const updateStartTime = new Date();
        
        try {
            const { 
                parallel = true, 
                maxConcurrency = 5,
                continueOnError = true 
            } = options;
            
            const enabledSources = Array.from(this.sources.values())
                .filter(source => source.metadata.enabled);
            
            console.log(`开始批量更新 ${enabledSources.length} 个配置源...`);
            
            const results = new Map();
            
            if (parallel) {
                // 并行更新
                const chunks = this.chunkArray(enabledSources, maxConcurrency);
                
                for (const chunk of chunks) {
                    const promises = chunk.map(async (source) => {
                        try {
                            const result = await this.updateSource(source.id);
                            results.set(source.id, result);
                        } catch (error) {
                            results.set(source.id, { 
                                success: false, 
                                error: error.message 
                            });
                            
                            if (!continueOnError) {
                                throw error;
                            }
                        }
                    });
                    
                    await Promise.all(promises);
                }
            } else {
                // 串行更新
                for (const source of enabledSources) {
                    try {
                        const result = await this.updateSource(source.id);
                        results.set(source.id, result);
                    } catch (error) {
                        results.set(source.id, { 
                            success: false, 
                            error: error.message 
                        });
                        
                        if (!continueOnError) {
                            throw error;
                        }
                    }
                }
            }
            
            // 统计结果
            const successCount = Array.from(results.values())
                .filter(r => r.success).length;
            const errorCount = results.size - successCount;
            const changedCount = Array.from(results.values())
                .filter(r => r.success && r.changed).length;
            
            // 更新全局统计
            this.lastGlobalUpdate = updateStartTime;
            this.stats.updateCount += 1;
            this.stats.lastUpdate = updateStartTime;
            
            console.log(`批量更新完成: ${successCount} 成功, ${errorCount} 失败, ${changedCount} 发生变更`);
            
            // 触发全局更新完成事件
            this.emit('globalUpdateCompleted', {
                totalSources: results.size,
                successCount,
                errorCount,
                changedCount,
                duration: Date.now() - updateStartTime.getTime(),
                results
            });
            
            return results;
            
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * 获取所有活跃节点
     * @returns {ProxyNode[]} - 活跃节点数组
     */
    getAllActiveNodes() {
        return Array.from(this.nodeIndex.values()).filter(node => {
            const source = this.sources.get(node.sourceId);
            return node.metadata.isActive && 
                   source && 
                   source.isAvailable();
        });
    }
    
    /**
     * 获取指定配置源的节点
     * @param {string} sourceId - 配置源ID
     * @returns {ProxyNode[]} - 节点数组
     */
    getSourceNodes(sourceId) {
        const source = this.sources.get(sourceId);
        return source ? source.getActiveNodes() : [];
    }
    
    /**
     * 根据条件筛选节点
     * @param {object} filters - 筛选条件
     * @returns {ProxyNode[]} - 筛选结果
     */
    filterNodes(filters) {
        const allNodes = this.getAllActiveNodes();
        return allNodes.filter(node => node.matchesFilters(filters));
    }
    
    /**
     * 获取配置源信息
     * @param {string} sourceId - 配置源ID
     * @returns {ConfigSource|null} - 配置源对象
     */
    getSource(sourceId) {
        return this.sources.get(sourceId) || null;
    }
    
    /**
     * 获取所有配置源信息
     * @returns {ConfigSource[]} - 配置源数组
     */
    getAllSources() {
        return Array.from(this.sources.values());
    }
    
    /**
     * 启用/禁用配置源
     * @param {string} sourceId - 配置源ID
     * @param {boolean} enabled - 是否启用
     * @returns {boolean} - 操作是否成功
     */
    setSourceEnabled(sourceId, enabled) {
        const source = this.sources.get(sourceId);
        if (!source) {
            return false;
        }
        
        if (enabled) {
            source.enable();
        } else {
            source.disable();
        }
        
        this.updateStats();
        this.emit('sourceEnabledChanged', sourceId, enabled);
        
        return true;
    }
    
    /**
     * 检测配置源变更
     * @returns {Promise<object[]>} - 变更列表
     */
    async detectChanges() {
        const changes = [];
        
        for (const [sourceId, source] of this.sources) {
            if (!source.metadata.enabled || source.type !== SourceType.URL) {
                continue;
            }
            
            try {
                // 获取内容但不更新
                const fetchResult = await this.contentFetcher.fetchContent(source);
                
                if (fetchResult.success) {
                    const newVersion = source.calculateVersion(fetchResult.content);
                    
                    if (newVersion !== source.version) {
                        changes.push({
                            sourceId,
                            type: 'content_changed',
                            oldVersion: source.version,
                            newVersion,
                            source: fetchResult.source
                        });
                    }
                }
            } catch (error) {
                changes.push({
                    sourceId,
                    type: 'fetch_error',
                    error: error.message
                });
            }
        }
        
        return changes;
    }
    
    /**
     * 获取系统统计信息
     * @returns {object} - 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            sources: Array.from(this.sources.values()).map(source => source.getStats())
        };
    }
    
    /**
     * 获取健康状态报告
     * @returns {Promise<object>} - 健康状态报告
     */
    async getHealthReport() {
        const report = {
            overall: 'healthy',
            timestamp: new Date(),
            summary: {
                totalSources: this.sources.size,
                healthySources: 0,
                unhealthySources: 0,
                disabledSources: 0
            },
            sources: []
        };
        
        for (const source of this.sources.values()) {
            const sourceHealth = {
                id: source.id,
                type: source.type,
                status: source.status,
                enabled: source.metadata.enabled,
                healthy: source.isHealthy(),
                nodeCount: source.nodeCount,
                lastSuccess: source.lastSuccess,
                errorInfo: source.errorInfo
            };
            
            if (!source.metadata.enabled) {
                report.summary.disabledSources++;
            } else if (sourceHealth.healthy) {
                report.summary.healthySources++;
            } else {
                report.summary.unhealthySources++;
            }
            
            report.sources.push(sourceHealth);
        }
        
        // 确定整体健康状态
        if (report.summary.unhealthySources > 0) {
            if (report.summary.healthySources === 0) {
                report.overall = 'critical';
            } else {
                report.overall = 'warning';
            }
        }
        
        return report;
    }
    
    /**
     * 验证配置源配置
     * @param {string} type - 配置源类型
     * @param {object} config - 配置对象
     * @private
     */
    validateSourceConfig(type, config) {
        switch (type) {
            case SourceType.URL:
                if (!config.url || typeof config.url !== 'string') {
                    throw new Error('URL配置源必须包含有效的url字段');
                }
                try {
                    new URL(config.url);
                } catch (error) {
                    throw new Error('URL格式无效');
                }
                break;
                
            case SourceType.LOCAL:
                if (!config.path || typeof config.path !== 'string') {
                    throw new Error('本地文件配置源必须包含有效的path字段');
                }
                break;
                
            case SourceType.MANUAL:
                // 手动上传配置源不需要额外验证
                break;
                
            default:
                throw new Error(`不支持的配置源类型: ${type}`);
        }
    }
    
    /**
     * 更新全局节点索引
     * @param {string} sourceId - 配置源ID
     * @param {ProxyNode[]} nodes - 节点数组
     * @private
     */
    updateNodeIndex(sourceId, nodes) {
        // 移除该源的旧节点
        this.removeSourceFromNodeIndex(sourceId);
        
        // 添加新节点
        for (const node of nodes) {
            this.nodeIndex.set(node.id, node);
        }
    }
    
    /**
     * 从全局节点索引中移除指定源的所有节点
     * @param {string} sourceId - 配置源ID
     * @private
     */
    removeSourceFromNodeIndex(sourceId) {
        for (const [nodeId, node] of this.nodeIndex) {
            if (node.sourceId === sourceId) {
                this.nodeIndex.delete(nodeId);
            }
        }
    }
    
    /**
     * 更新统计信息
     * @private
     */
    updateStats() {
        this.stats.totalSources = this.sources.size;
        this.stats.activeSources = Array.from(this.sources.values())
            .filter(source => source.isAvailable()).length;
        this.stats.totalNodes = this.nodeIndex.size;
        this.stats.activeNodes = this.getAllActiveNodes().length;
    }
    
    /**
     * 将数组分块
     * @param {Array} array - 原数组
     * @param {number} size - 块大小
     * @returns {Array[]} - 分块后的数组
     * @private
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = ConfigSourceManager; 