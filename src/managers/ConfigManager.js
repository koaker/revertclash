const fs = require('fs').promises;
const path = require('path');
const YAML = require('yaml');

// 引入新的模块化组件
const { ConfigSource, SourceType, ProxyNode } = require('../models');
const ConfigSourceManager = require('./ConfigSourceManager');
const { NodeAggregator } = require('../aggregators');
const { URLManager } = require('../urlManager');

/**
 * 主配置管理器
 * 整合所有组件，提供统一的配置处理接口
 */
class ConfigManager {
    constructor(options = {}) {
        // 配置路径
        this.paths = {
            configsDir: options.configsDir || path.join(__dirname, '..', '..', 'configs'),
            outputFile: options.outputFile || path.join(__dirname, '..', '..', 'data', 'merged-config.yaml'),
            processedOutputFile: options.processedOutputFile || path.join(__dirname, '..', '..', 'data', 'processed-merged-config.yaml'),
            urlConfigFile: options.urlConfigFile || path.join(__dirname, '..', '..', 'clash-urls.txt')
        };
        
        // 核心组件
        this.sourceManager = new ConfigSourceManager();
        this.nodeAggregator = new NodeAggregator();
        this.urlManager = new URLManager(this.paths.urlConfigFile);
        
        // 配置状态
        this.isInitialized = false;
        this.isProcessing = false;
        this.lastProcessTime = null;
        
        // 配置选项
        this.config = {
            enableCache: true,
            enableConflictResolution: true,
            enableFiltering: true,
            cacheExpireHours: 24,
            maxRetries: 2,
            timeout: 15000,
            maxNodes: null,
            ...options
        };
        
        // 绑定事件处理器
        this.setupEventHandlers();
        
        // 统计信息
        this.stats = {
            lastProcess: null,
            totalProcessCount: 0,
            successCount: 0,
            errorCount: 0,
            totalNodes: 0,
            activeNodes: 0
        };
        
        console.log('ConfigManager 初始化完成');
    }
    
    /**
     * 初始化配置管理器
     * @returns {Promise<boolean>} - 初始化是否成功
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('ConfigManager 已经初始化');
            return true;
        }
        
        if (this.isProcessing) {
            console.log('ConfigManager 正在初始化中，等待完成...');
            // 等待初始化完成
            while (this.isProcessing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.isInitialized;
        }
        
        try {
            console.log('开始初始化 ConfigManager...');
            
            // 1. 注册本地配置源
            await this.registerLocalSources();
            
            // 2. 注册URL配置源
            await this.registerUrlSources();
            
            // 3. 发现并注册缓存配置源
            await this.registerCacheSources();
            
            // 4. 配置节点聚合器
            this.configureAggregator();
            
            this.isInitialized = true;
            console.log('ConfigManager 初始化成功');
            
            return true;
            
        } catch (error) {
            console.error('ConfigManager 初始化失败:', error.message);
            throw error;
        }
    }
    
    /**
     * 处理所有配置源并生成最终配置文件
     * @param {object} options - 处理选项
     * @returns {Promise<object>} - 处理结果
     */
    async processConfigs(options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.isProcessing) {
            console.warn('配置处理正在进行中，等待完成...');
            // 等待当前处理完成
            while (this.isProcessing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log('前一个配置处理已完成，开始新的处理...');
        }
        
        this.isProcessing = true;
        const startTime = new Date();
        
        try {
            console.log('开始处理配置 (重构版)...');
            
            // 合并处理选项
            const processOptions = { ...this.config, ...options };
            
            // 第一阶段：更新所有配置源
            console.log('=== 阶段1：更新配置源 ===');
            const updateResults = await this.sourceManager.updateAllSources({
                parallel: true,
                maxConcurrency: 5,
                continueOnError: true
            });
            
            // 统计更新结果
            const successSources = Array.from(updateResults.values()).filter(r => r.success);
            const failedSources = Array.from(updateResults.values()).filter(r => !r.success);
            
            console.log(`配置源更新完成: ${successSources.length} 成功, ${failedSources.length} 失败`);
            
            // 第二阶段：聚合节点
            console.log('=== 阶段2：聚合节点 ===');
            const sourceNodes = this.collectSourceNodes();
            
            const aggregationResult = await this.nodeAggregator.aggregate(sourceNodes, {
                maxNodes: processOptions.maxNodes,
                enableConflictResolution: processOptions.enableConflictResolution,
                enableFiltering: processOptions.enableFiltering
            });
            
            console.log(`节点聚合完成: ${aggregationResult.total} 个最终节点`);
            
            // 第三阶段：生成配置文件
            console.log('=== 阶段3：生成配置文件 ===');
            const configResult = await this.generateConfigFiles(aggregationResult.nodes, processOptions);
            
            // 第四阶段：更新统计信息
            this.updateProcessStats(startTime, aggregationResult, updateResults);
            
            const result = {
                success: true,
                timestamp: startTime,
                duration: Date.now() - startTime.getTime(),
                sources: {
                    total: updateResults.size,
                    success: successSources.length,
                    failed: failedSources.length,
                    results: updateResults
                },
                nodes: {
                    total: aggregationResult.total,
                    byType: aggregationResult.statistics.nodesByType,
                    bySource: aggregationResult.statistics.nodesBySource
                },
                files: configResult,
                stats: this.stats
            };
            
            console.log('配置处理流程完成');
            return result;
            
        } catch (error) {
            console.error('配置处理失败:', error.message);
            this.stats.errorCount += 1;
            throw error;
            
        } finally {
            this.isProcessing = false;
            this.lastProcessTime = new Date();
        }
    }
    
    /**
     * 注册本地配置源
     * @private
     */
    async registerLocalSources() {
        try {
            const files = await fs.readdir(this.paths.configsDir);
            const yamlFiles = files.filter(file => 
                file.endsWith('.yaml') || file.endsWith('.yml')
            );
            
            for (const file of yamlFiles) {
                const sourceId = file.replace(/\.(yaml|yml)$/, '');
                const filePath = path.join(this.paths.configsDir, file);
                
                await this.sourceManager.registerSource(sourceId, SourceType.LOCAL, {
                    path: filePath,
                    description: `本地配置文件: ${file}`,
                    enabled: true
                });
            }
            
            console.log(`注册了 ${yamlFiles.length} 个本地配置源`);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('configs 目录不存在，跳过本地配置源注册');
            } else {
                console.error('注册本地配置源失败:', error.message);
            }
        }
    }
    
    /**
     * 注册URL配置源
     * @private
     */
    async registerUrlSources() {
        try {
            const urls = await this.urlManager.readUrls();
            
            for (const { name, url } of urls) {
                await this.sourceManager.registerSource(name, SourceType.URL, {
                    url: url,
                    description: `订阅源: ${name}`,
                    enabled: true
                });
            }
            
            console.log(`注册了 ${urls.length} 个URL配置源`);
            
        } catch (error) {
            console.error('注册URL配置源失败:', error.message);
        }
    }
    
    /**
     * 注册缓存配置源（手动上传等）
     * @private
     */
    async registerCacheSources() {
        try {
            const ConfigCacheService = require('../services/configCacheService');
            const allCaches = await ConfigCacheService.getAllConfigs(true);
            
            // 找出不在URL列表中的独立缓存
            const urlNames = new Set((await this.urlManager.readUrls()).map(u => u.name));
            const independentCaches = allCaches.filter(cache => 
                !urlNames.has(cache.subscriptionName) && cache.configContent
            );
            
            for (const cache of independentCaches) {
                await this.sourceManager.registerSource(cache.subscriptionName, SourceType.MANUAL, {
                    description: `手动上传配置: ${cache.subscriptionName}`,
                    enabled: true,
                    uploadTime: cache.lastUpdated
                });
            }
            
            console.log(`注册了 ${independentCaches.length} 个缓存配置源`);
            
        } catch (error) {
            console.error('注册缓存配置源失败:', error.message);
        }
    }
    
    /**
     * 配置节点聚合器
     * @private
     */
    configureAggregator() {
        // 添加常用过滤器
        this.nodeAggregator.addCommonFilters();
        
        // 配置冲突解决器
        const conflictResolver = this.nodeAggregator.getConflictResolver();
        
        // 设置配置源优先级（可以根据需要调整）
        conflictResolver.setSourcePriorities({
            'premium-source': 100,
            'backup-source': 50
        });
        
        // 为特定模式设置冲突解决策略
        conflictResolver.setStrategyForPattern(/高级|premium|vip/i, 'source_priority');
        conflictResolver.setStrategyForPattern(/测试|test/i, 'latest');
        
        console.log('节点聚合器配置完成');
    }
    
    /**
     * 收集所有配置源的节点
     * @returns {Map<string, ProxyNode[]>} - 按配置源分组的节点映射
     * @private
     */
    collectSourceNodes() {
        const sourceNodes = new Map();
        const sources = this.sourceManager.getAllSources();
        
        for (const source of sources) {
            if (source.isAvailable()) {
                const nodes = source.getActiveNodes();
                if (nodes.length > 0) {
                    sourceNodes.set(source.id, nodes);
                }
            }
        }
        
        return sourceNodes;
    }
    
    /**
     * 生成配置文件
     * @param {ProxyNode[]} nodes - 节点数组
     * @param {object} options - 选项
     * @returns {Promise<object>} - 生成结果
     * @private
     */
    async generateConfigFiles(nodes, options) {
        const result = {
            mergedFile: null,
            processedFile: null
        };
        
        try {
            // 创建基础Clash配置
            const baseConfig = this.createBaseClashConfig();
            
            // 添加节点
            baseConfig.proxies = nodes.map(node => node.toClashConfig());
            
            // 生成代理组
            baseConfig['proxy-groups'] = this.generateProxyGroups(nodes);
            
            // 保存合并后的配置
            const mergedConfigYaml = YAML.stringify(baseConfig);
            await fs.writeFile(this.paths.outputFile, mergedConfigYaml);
            result.mergedFile = this.paths.outputFile;
            
            console.log(`合并后的配置已保存到: ${this.paths.outputFile}`);
            
            // 应用clash-configs处理（如果存在）
            let processedConfig = baseConfig;
            try {
                const clashConfigProcessor = require('../../clash-configs.js');
                processedConfig = clashConfigProcessor.main(baseConfig);
                console.log('已使用 clash-configs.js 处理配置');
            } catch (err) {
                console.warn('clash-configs.js 处理失败，使用原始配置:', err.message);
            }
            
            // 保存处理后的配置
            const processedConfigYaml = YAML.stringify(processedConfig);
            await fs.writeFile(this.paths.processedOutputFile, processedConfigYaml);
            result.processedFile = this.paths.processedOutputFile;
            
            console.log(`处理过的配置已保存到: ${this.paths.processedOutputFile}`);
            
        } catch (error) {
            console.error('生成配置文件失败:', error.message);
            throw error;
        }
        
        return result;
    }
    
    /**
     * 创建基础Clash配置
     * @returns {object} - 基础配置对象
     * @private
     */
    createBaseClashConfig() {
        return {
            port: 7890,
            'socks-port': 7891,
            'allow-lan': true,
            mode: 'rule',
            'log-level': 'info',
            proxies: [],
            'proxy-groups': [],
            rules: ['MATCH,DIRECT']
        };
    }
    
    /**
     * 生成代理组
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {Array} - 代理组配置
     * @private
     */
    generateProxyGroups(nodes) {
        const nodeNames = nodes.map(node => node.getDisplayName());
        
        const groups = [
            {
                name: '🚀 节点选择',
                type: 'select',
                proxies: nodeNames
            },
            {
                name: '♻️ 自动选择',
                type: 'url-test',
                proxies: nodeNames,
                url: 'http://www.gstatic.com/generate_204',
                interval: 300
            }
        ];
        
        // 按类型分组
        const nodesByType = {};
        for (const node of nodes) {
            if (!nodesByType[node.type]) {
                nodesByType[node.type] = [];
            }
            nodesByType[node.type].push(node.getDisplayName());
        }
        
        for (const [type, typeNodes] of Object.entries(nodesByType)) {
            if (typeNodes.length > 1) {
                groups.push({
                    name: `📡 ${type.toUpperCase()}`,
                    type: 'select',
                    proxies: typeNodes
                });
            }
        }
        
        return groups;
    }
    
    /**
     * 更新处理统计信息
     * @param {Date} startTime - 开始时间
     * @param {object} aggregationResult - 聚合结果
     * @param {Map} updateResults - 更新结果
     * @private
     */
    updateProcessStats(startTime, aggregationResult, updateResults) {
        this.stats.lastProcess = startTime;
        this.stats.totalProcessCount += 1;
        
        const successCount = Array.from(updateResults.values()).filter(r => r.success).length;
        if (successCount > 0) {
            this.stats.successCount += 1;
        } else {
            this.stats.errorCount += 1;
        }
        
        this.stats.totalNodes = aggregationResult.total;
        this.stats.activeNodes = aggregationResult.statistics.activeNodes;
    }
    
    /**
     * 设置事件处理器
     * @private
     */
    setupEventHandlers() {
        // 监听配置源更新事件
        this.sourceManager.on('sourceUpdated', (sourceId, updateResult) => {
            console.log(`配置源更新: ${sourceId} - ${updateResult.nodeCount} 个节点`);
        });
        
        this.sourceManager.on('sourceError', (sourceId, error) => {
            console.error(`配置源错误: ${sourceId} - ${error.message}`);
        });
        
        this.sourceManager.on('globalUpdateCompleted', (summary) => {
            console.log(`全局更新完成: ${summary.successCount}/${summary.totalSources} 成功`);
        });
    }
    
    /**
     * 获取系统状态
     * @returns {object} - 系统状态信息
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            processing: this.isProcessing,
            lastProcessTime: this.lastProcessTime,
            sourceManager: this.sourceManager.getStats(),
            nodeAggregator: this.nodeAggregator.getStats(),
            stats: this.stats,
            config: this.config
        };
    }
    
    /**
     * 获取健康状态报告
     * @returns {Promise<object>} - 健康状态报告
     */
    async getHealthReport() {
        const sourceHealth = await this.sourceManager.getHealthReport();
        
        return {
            overall: sourceHealth.overall,
            timestamp: new Date(),
            components: {
                configManager: {
                    status: this.isInitialized ? 'healthy' : 'not_initialized',
                    processing: this.isProcessing,
                    lastProcess: this.lastProcessTime,
                    stats: this.stats
                },
                sourceManager: sourceHealth,
                nodeAggregator: {
                    status: 'healthy',
                    stats: this.nodeAggregator.getStats()
                }
            }
        };
    }
    
    /**
     * 手动添加配置源
     * @param {string} sourceId - 配置源ID
     * @param {string} type - 配置源类型
     * @param {object} config - 配置源配置
     * @returns {Promise<ConfigSource>} - 配置源对象
     */
    async addSource(sourceId, type, config) {
        const source = await this.sourceManager.registerSource(sourceId, type, config);
        
        // 立即尝试更新新添加的配置源
        try {
            await this.sourceManager.updateSource(sourceId);
        } catch (error) {
            console.warn(`新添加的配置源 ${sourceId} 初始更新失败:`, error.message);
        }
        
        return source;
    }
    
    /**
     * 移除配置源
     * @param {string} sourceId - 配置源ID
     * @returns {Promise<boolean>} - 是否成功移除
     */
    async removeSource(sourceId) {
        return await this.sourceManager.unregisterSource(sourceId);
    }
    
    /**
     * 获取节点统计信息
     * @returns {object} - 节点统计
     */
    getNodeStatistics() {
        const allNodes = this.sourceManager.getAllActiveNodes();
        
        const stats = {
            total: allNodes.length,
            byType: {},
            bySource: {},
            active: 0,
            recent: 0 // 最近24小时更新的节点
        };
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        for (const node of allNodes) {
            // 按类型统计
            stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;
            
            // 按配置源统计
            stats.bySource[node.sourceId] = (stats.bySource[node.sourceId] || 0) + 1;
            
            // 活跃节点统计
            if (node.metadata.isActive) {
                stats.active++;
            }
            
            // 最近更新的节点
            if (new Date(node.metadata.lastUpdated) > oneDayAgo) {
                stats.recent++;
            }
        }
        
        return stats;
    }
}

module.exports = ConfigManager; 