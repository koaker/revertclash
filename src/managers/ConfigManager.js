const YAML = require('yaml');

// 引入新的模块化组件
const { SourceType, ProxyNode } = require('../models');
const ConfigSourceManager = require('./ConfigSourceManager');
const { NodeAggregator } = require('../aggregators');

/**
 * 主配置管理器
 * 整合所有组件，提供统一的配置处理接口
 */
class ConfigManager {
    constructor(options = {}) {
        // 核心组件
        this.sourceManager = new ConfigSourceManager();
        this.nodeAggregator = new NodeAggregator();
        
        // 配置选项
        this.config = {
            enableConflictResolution: true,
            enableFiltering: true,
            cacheExpireHours: 24,
            maxRetries: 2,
            timeout: 15000,
            maxNodes: null,
            ...options
        };
        
        this.configureAggregator();
        this.lastAggregationTime = null;
        console.log('ConfigManager 初始化完成');
    }
    
    /* source格式: [
        { name: '订阅链接1', type: SourceType.URL, data: 'http://...' },
        { name: '我的节点', type: SourceType.MANUAL, data: 'proxies:\n- name: ...' }
        ]
        公开暴露的处理方法供外部调用
    */
    async process(sources, options = {}) {
        const startTime = new Date();
        try {
            // 调用核心处理逻辑获取聚合节点
            const {aggregationResult, updateResults} = await this._processSources(sources, options);

            const successSources = Array.from(updateResults.values()).filter(r => r.success);
            const failedSources = Array.from(updateResults.values()).filter(r => !r.success);

            this.lastAggregationResult = aggregationResult;
            const result = await this.generateConfigContent(aggregationResult.nodes, options);
            //console.log('配置文件生成完成:', result);
            return {
                success: true,
                timestamp: startTime,
                duration: Date.now() - startTime.getTime(),
                processedConfig: result.processedConfigContent,
                mergedConfig: result.mergedConfigContent,
                stats: {
                    sources: {
                        total: updateResults.size,
                        success: successSources.length,
                        failed: failedSources.length,
                    },
                    nodes: {
                        total: aggregationResult.total,
                        byType: aggregationResult.statistics.nodesByType,
                    }
                }
            };
        } catch (error) {
            console.error('处理配置源时出错:', error.message);
        }
    }

    /**
     * 内部处理逻辑：数据源注册和聚合节点
     * @private
     */
    async _processSources(sources, options = {}) {
        for (const source of sources) {
            if (!source.name || !source.type || !source.data) {
                console.log('配置源缺少必要字段:', source);
                throw new Error('配置源必须包含 name, type 和 data 字段');
            }
            if (source.type === SourceType.URL) {
                await this.sourceManager.registerSource(source.name, SourceType.URL, {
                    url: source.data,
                    description: `订阅源: ${source.name}`,
                    enabled: true
                });
            } else if (source.type === SourceType.MANUAL) {
                await this.sourceManager.registerSource(source.name, SourceType.MANUAL, {
                    content: source.data,
                    description: `手动上传配置: ${source.name}`,
                    enabled: true
                });
            } else if (source.type === SourceType.LOCAL) {
                await this.sourceManager.registerSource(source.name, SourceType.LOCAL, {
                    path: source.data,
                    description: `本地配置文件: ${source.name}`,
                    enabled: true
                });
            }
        }
        const updateResults = await this.sourceManager.updateAllSources({
            parallel: true,
            maxConcurrency: 5,
            continueOnError: true
        });

        const sourceNodes = await this.collectSourceNodes();
        console.log(`收集到 ${sourceNodes.size} 个源节点`);

        const aggregationResult = await this.nodeAggregator.aggregate(sourceNodes, {
            maxNodes: options.maxNodes || null,
            enableConflictResolution: options.enableConflictResolution || true,
            enableFiltering: options.enableFiltering || true
        });

        this.lastAggregationResult = aggregationResult;

        return {aggregationResult, updateResults};
    }

    /*
     * 处理所有配置源并直接返回结构化数据
     */
    async processAndGetNodes(sources, options = {}) {
        const {aggregationResult} = await this._processSources(sources, options);
        if (!aggregationResult) {
            return null;
        }
        return {nodes: aggregationResult.nodes, sourceNodeMap: aggregationResult.sourceNodeMap};
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
     * 获取上一次聚合的节点统计信息
     */
    getNodeStatistics() {
        if (!this.lastAggregationResult) {
            return {
                total: 0,
                byType: {},
                bySource: {},
                message: '尚未处理任何配置，无统计信息'
            };
        }
        return this.lastAggregationResult.statistics;
    }

    /**
     * 获取系统状态，主要关注配置源
     */
    getSystemStatus() {
        const sources = this.sourceManager.getAllSources();
        const status = {
            totalSources: sources.length,
            enabledSources: sources.filter(s => s.enabled).length,
            lastUpdateTime: this.sourceManager.lastUpdateTime,
            sources: sources.map(s => s.getStats())
        };
        return status;
    }

    /**
     * 获取健康报告，识别更新失败的配置源
     */
    getHealthReport() {
        const sources = this.sourceManager.getAllSources();
        const failedSources = sources.filter(s => s.isAvailable() === false && s.lastUpdateError !== null);
        
        return {
            isHealthy: failedSources.length === 0,
            totalSources: sources.length,
            failedCount: failedSources.length,
            failedDetails: failedSources.map(s => ({
                id: s.id,
                name: s.name,
                error: s.lastUpdateError,
                lastAttempt: s.lastUpdateTime
            }))
        };
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
    async generateConfigContent(nodes, options) {
        const result = {
            mergedFile: null,
            processedFile: null,
            mergedConfigContent: null,
            processedConfigContent: null
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
            result.mergedConfigContent = mergedConfigYaml;

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
            result.processedConfigContent = processedConfigYaml;

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
        // 简化配置：只生成基础的手动选择策略组
        // 复杂的策略组配置由 clash-configs.js 处理
        const groups = [
            {
                name: '手动选择所有节点',
                type: 'select',
                proxies: [],
                'include-all': true
            }
        ];
        
        return groups;
    }
}

module.exports = ConfigManager; 