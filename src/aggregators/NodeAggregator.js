const { ConflictResolver, ConflictStrategy } = require('./ConflictResolver');

/**
 * 聚合模式枚举
 */
const AggregationMode = {
    MERGE: 'merge',               // 合并所有节点
    REPLACE: 'replace',           // 替换模式
    PRIORITY: 'priority',         // 按优先级聚合
    SELECTIVE: 'selective'        // 选择性聚合
};

/**
 * 排序方式枚举
 */
const SortBy = {
    NAME: 'name',                 // 按名称排序
    TYPE: 'type',                 // 按类型排序
    SOURCE: 'source',             // 按配置源排序
    PRIORITY: 'priority',         // 按优先级排序
    LATENCY: 'latency',          // 按延迟排序（需要测试数据）
    LAST_UPDATED: 'last_updated'  // 按更新时间排序
};

/**
 * 节点聚合器
 * 负责将多个配置源的节点聚合为最终的节点列表
 */
class NodeAggregator {
    constructor() {
        // 冲突解决器
        this.conflictResolver = new ConflictResolver();
        
        // 聚合结果存储
        this.aggregatedNodes = [];        // 聚合后的节点列表
        this.sourceNodeMap = new Map();   // 配置源到节点的映射
        this.lastAggregationResult = null; // 最后一次聚合的完整结果
        
        // 聚合配置
        this.config = {
            mode: AggregationMode.MERGE,
            enableConflictResolution: true,
            enableFiltering: true,
            enableSorting: true,
            maxNodes: null,              // 最大节点数限制
            sortBy: SortBy.NAME,
            sortOrder: 'asc'             // 'asc' | 'desc'
        };
        
        // 过滤器配置
        this.filters = new Map();       // filterName -> filterFunction
        this.activeFilters = new Set(); // 激活的过滤器名称
        
        // 分组配置
        this.grouping = {
            enabled: false,
            groupBy: 'type',             // 分组依据：'type', 'source', 'tag', 'custom'
            customGroupFunction: null    // 自定义分组函数
        };
        
        // 统计信息
        this.stats = {
            lastAggregation: null,
            totalInputNodes: 0,
            totalOutputNodes: 0,
            filteredOutNodes: 0,
            conflictsResolved: 0,
            aggregationTime: 0,
            groupCount: 0
        };
    }
    
    /**
     * 获取聚合后的所有节点
     * @returns {ProxyNode[]} - 聚合后的节点数组
     */
    getAggregatedNodes() {
        return [...this.aggregatedNodes];
    }
    
    /**
     * 获取按配置源分组的节点
     * @returns {Map<string, ProxyNode[]>} - 配置源到节点的映射
     */
    getNodesBySource() {
        return new Map(this.sourceNodeMap);
    }
    
    /**
     * 获取最后一次聚合的完整结果
     * @returns {object|null} - 聚合结果对象
     */
    getLastAggregationResult() {
        return this.lastAggregationResult;
    }
    
    /**
     * 清空聚合结果
     */
    clearAggregatedNodes() {
        this.aggregatedNodes = [];
        this.sourceNodeMap.clear();
        this.lastAggregationResult = null;
    }
    
    /**
     * 设置聚合模式
     * @param {string} mode - 聚合模式
     */
    setAggregationMode(mode) {
        if (!Object.values(AggregationMode).includes(mode)) {
            throw new Error(`无效的聚合模式: ${mode}`);
        }
        this.config.mode = mode;
    }
    
    /**
     * 设置排序配置
     * @param {string} sortBy - 排序字段
     * @param {string} order - 排序顺序 ('asc' | 'desc')
     */
    setSorting(sortBy, order = 'asc') {
        if (!Object.values(SortBy).includes(sortBy)) {
            throw new Error(`无效的排序字段: ${sortBy}`);
        }
        if (!['asc', 'desc'].includes(order)) {
            throw new Error(`无效的排序顺序: ${order}`);
        }
        
        this.config.sortBy = sortBy;
        this.config.sortOrder = order;
    }
    
    /**
     * 设置节点数量限制
     * @param {number|null} maxNodes - 最大节点数
     */
    setMaxNodes(maxNodes) {
        this.config.maxNodes = maxNodes > 0 ? maxNodes : null;
    }
    
    /**
     * 添加过滤器
     * @param {string} name - 过滤器名称
     * @param {function} filterFunction - 过滤函数 (node) => boolean
     */
    addFilter(name, filterFunction) {
        if (typeof filterFunction !== 'function') {
            throw new Error('过滤器必须是一个函数');
        }
        this.filters.set(name, filterFunction);
    }
    
    /**
     * 激活过滤器
     * @param {string} name - 过滤器名称
     */
    enableFilter(name) {
        if (!this.filters.has(name)) {
            throw new Error(`过滤器 ${name} 不存在`);
        }
        this.activeFilters.add(name);
    }
    
    /**
     * 禁用过滤器
     * @param {string} name - 过滤器名称
     */
    disableFilter(name) {
        this.activeFilters.delete(name);
    }
    
    /**
     * 设置分组配置
     * @param {object} groupConfig - 分组配置
     */
    setGrouping(groupConfig) {
        Object.assign(this.grouping, groupConfig);
    }
    
    /**
     * 获取冲突解决器
     * @returns {ConflictResolver} - 冲突解决器实例
     */
    getConflictResolver() {
        return this.conflictResolver;
    }
    
    /**
     * 聚合节点
     * @param {Map<string, ProxyNode[]>} sourceNodes - 按配置源分组的节点映射
     * @param {object} options - 聚合选项
     * @returns {Promise<object>} - 聚合结果
     */
    async aggregate(sourceNodes, options = {}) {
        const startTime = Date.now();
        
        try {
            console.log('开始节点聚合处理...');
            
            // 合并选项
            const aggregateOptions = { ...this.config, ...options };
            
            // 第一阶段：收集所有节点
            const allNodes = this.collectAllNodes(sourceNodes, aggregateOptions);
            
            console.log(`收集到 ${allNodes.length} 个节点，来自 ${sourceNodes.size} 个配置源`);
            
            // 第二阶段：应用过滤器
            const filteredNodes = this.applyFilters(allNodes);
            
            console.log(`过滤后剩余 ${filteredNodes.length} 个节点`);
            
            // 第三阶段：解决冲突
            const resolvedNodes = this.resolveConflicts(filteredNodes, aggregateOptions);
            
            console.log(`冲突解决后剩余 ${resolvedNodes.length} 个节点`);
            
            // 第四阶段：排序
            const sortedNodes = this.sortNodes(resolvedNodes, aggregateOptions);
            
            // 第五阶段：限制数量
            const limitedNodes = this.limitNodes(sortedNodes, aggregateOptions);
            
            console.log(`最终聚合结果: ${limitedNodes.length} 个节点`);
            
            // 第六阶段：分组（如果启用）
            const result = this.organizeResult(limitedNodes, aggregateOptions);
            
            // 更新统计信息
            this.updateStats(allNodes, limitedNodes, startTime);
            
            // 存储聚合结果
            this.aggregatedNodes = limitedNodes;
            this.sourceNodeMap = sourceNodes;
            this.lastAggregationResult = result;
            
            return result;
            
        } catch (error) {
            console.error('节点聚合失败:', error.message);
            throw error;
        }
    }
    
    /**
     * 收集所有节点
     * @param {Map<string, ProxyNode[]>} sourceNodes - 源节点映射
     * @param {object} options - 选项
     * @returns {ProxyNode[]} - 收集的节点数组
     * @private
     */
    collectAllNodes(sourceNodes, options) {
        const allNodes = [];
        
        switch (options.mode) {
            case AggregationMode.MERGE:
                // 合并所有配置源的节点
                for (const nodes of sourceNodes.values()) {
                    allNodes.push(...nodes);
                }
                break;
                
            case AggregationMode.PRIORITY:
                // 按配置源优先级合并
                const sortedSources = Array.from(sourceNodes.entries())
                    .sort(([, ], [, ]) => {
                        // 这里可以根据配置源的优先级排序
                        // 暂时按字母顺序排序
                        return 0;
                    });
                
                for (const [, nodes] of sortedSources) {
                    allNodes.push(...nodes);
                }
                break;
                
            case AggregationMode.SELECTIVE:
                // 选择性聚合（只聚合特定类型或标签的节点）
                for (const nodes of sourceNodes.values()) {
                    const selectedNodes = nodes.filter(node => {
                        // 这里可以添加选择逻辑
                        return node.metadata.isActive;
                    });
                    allNodes.push(...selectedNodes);
                }
                break;
                
            case AggregationMode.REPLACE:
                // 替换模式（只使用优先级最高的配置源）
                if (sourceNodes.size > 0) {
                    const firstSource = sourceNodes.values().next().value;
                    allNodes.push(...firstSource);
                }
                break;
                
            default:
                throw new Error(`不支持的聚合模式: ${options.mode}`);
        }
        
        return allNodes;
    }
    
    /**
     * 应用过滤器
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {ProxyNode[]} - 过滤后的节点数组
     * @private
     */
    applyFilters(nodes) {
        if (!this.config.enableFiltering || this.activeFilters.size === 0) {
            return nodes;
        }
        
        let filteredNodes = nodes;
        
        for (const filterName of this.activeFilters) {
            const filterFunction = this.filters.get(filterName);
            if (filterFunction) {
                const beforeCount = filteredNodes.length;
                filteredNodes = filteredNodes.filter(filterFunction);
                const afterCount = filteredNodes.length;
                
                console.log(`过滤器 "${filterName}": ${beforeCount} -> ${afterCount} 个节点`);
            }
        }
        
        return filteredNodes;
    }
    
    /**
     * 解决冲突
     * @param {ProxyNode[]} nodes - 节点数组
     * @param {object} options - 选项
     * @returns {ProxyNode[]} - 解决冲突后的节点数组
     * @private
     */
    resolveConflicts(nodes, options) {
        if (!options.enableConflictResolution) {
            return nodes;
        }
        
        const resolvedNodes = this.conflictResolver.resolve(nodes);
        const conflictStats = this.conflictResolver.getStats();
        
        console.log(`冲突解决统计: ${conflictStats.totalConflicts} 个冲突, ${conflictStats.resolvedConflicts} 个已解决`);
        
        return resolvedNodes;
    }
    
    /**
     * 排序节点
     * @param {ProxyNode[]} nodes - 节点数组
     * @param {object} options - 选项
     * @returns {ProxyNode[]} - 排序后的节点数组
     * @private
     */
    sortNodes(nodes, options) {
        if (!options.enableSorting) {
            return nodes;
        }
        
        const sortedNodes = [...nodes];
        const { sortBy, sortOrder } = options;
        
        sortedNodes.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case SortBy.NAME:
                    comparison = a.getDisplayName().localeCompare(b.getDisplayName());
                    break;
                    
                case SortBy.TYPE:
                    comparison = a.type.localeCompare(b.type);
                    break;
                    
                case SortBy.SOURCE:
                    comparison = a.sourceId.localeCompare(b.sourceId);
                    break;
                    
                case SortBy.PRIORITY:
                    comparison = b.metadata.priority - a.metadata.priority; // 高优先级在前
                    break;
                    
                case SortBy.LAST_UPDATED:
                    comparison = new Date(b.metadata.lastUpdated) - new Date(a.metadata.lastUpdated);
                    break;
                    
                case SortBy.LATENCY:
                    // 需要延迟测试数据，暂时按名称排序
                    comparison = a.getDisplayName().localeCompare(b.getDisplayName());
                    break;
                    
                default:
                    comparison = a.getDisplayName().localeCompare(b.getDisplayName());
            }
            
            return sortOrder === 'desc' ? -comparison : comparison;
        });
        
        return sortedNodes;
    }
    
    /**
     * 限制节点数量
     * @param {ProxyNode[]} nodes - 节点数组
     * @param {object} options - 选项
     * @returns {ProxyNode[]} - 限制后的节点数组
     * @private
     */
    limitNodes(nodes, options) {
        if (!options.maxNodes || options.maxNodes >= nodes.length) {
            return nodes;
        }
        
        console.log(`限制节点数量: ${nodes.length} -> ${options.maxNodes}`);
        return nodes.slice(0, options.maxNodes);
    }
    
    /**
     * 组织结果
     * @param {ProxyNode[]} nodes - 节点数组
     * @param {object} options - 选项
     * @returns {object} - 组织后的结果
     * @private
     */
    organizeResult(nodes, options) {
        const result = {
            nodes: nodes,
            total: nodes.length,
            timestamp: new Date(),
            metadata: {
                aggregationMode: options.mode,
                sortBy: options.sortBy,
                sortOrder: options.sortOrder,
                filtersApplied: Array.from(this.activeFilters),
                conflictResolutionEnabled: options.enableConflictResolution
            }
        };
        
        // 如果启用分组
        if (this.grouping.enabled) {
            result.groups = this.groupNodes(nodes);
            result.metadata.groupedBy = this.grouping.groupBy;
        }
        
        // 添加节点类型统计
        result.statistics = this.generateStatistics(nodes);
        
        return result;
    }
    
    /**
     * 分组节点
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {object} - 分组结果
     * @private
     */
    groupNodes(nodes) {
        const groups = new Map();
        
        for (const node of nodes) {
            let groupKey;
            
            switch (this.grouping.groupBy) {
                case 'type':
                    groupKey = node.type;
                    break;
                    
                case 'source':
                    groupKey = node.sourceId;
                    break;
                    
                case 'tag':
                    groupKey = node.metadata.tags.length > 0 ? node.metadata.tags[0] : 'untagged';
                    break;
                    
                case 'custom':
                    if (this.grouping.customGroupFunction) {
                        groupKey = this.grouping.customGroupFunction(node);
                    } else {
                        groupKey = 'default';
                    }
                    break;
                    
                default:
                    groupKey = 'default';
            }
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(node);
        }
        
        // 转换为对象格式
        const groupsObject = {};
        for (const [key, groupNodes] of groups) {
            groupsObject[key] = {
                nodes: groupNodes,
                count: groupNodes.length
            };
        }
        
        return groupsObject;
    }
    
    /**
     * 生成统计信息
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {object} - 统计信息
     * @private
     */
    generateStatistics(nodes) {
        const stats = {
            totalNodes: nodes.length,
            nodesByType: {},
            nodesBySource: {},
            activeNodes: 0,
            tagsCount: 0
        };
        
        const allTags = new Set();
        
        for (const node of nodes) {
            // 按类型统计
            stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
            
            // 按配置源统计
            stats.nodesBySource[node.sourceId] = (stats.nodesBySource[node.sourceId] || 0) + 1;
            
            // 活跃节点统计
            if (node.metadata.isActive) {
                stats.activeNodes++;
            }
            
            // 标签统计
            for (const tag of node.metadata.tags) {
                allTags.add(tag);
            }
        }
        
        stats.tagsCount = allTags.size;
        stats.uniqueTags = Array.from(allTags);
        
        return stats;
    }
    
    /**
     * 更新统计信息
     * @param {ProxyNode[]} inputNodes - 输入节点
     * @param {ProxyNode[]} outputNodes - 输出节点
     * @param {number} startTime - 开始时间
     * @private
     */
    updateStats(inputNodes, outputNodes, startTime) {
        this.stats = {
            lastAggregation: new Date(),
            totalInputNodes: inputNodes.length,
            totalOutputNodes: outputNodes.length,
            filteredOutNodes: inputNodes.length - outputNodes.length,
            conflictsResolved: this.conflictResolver.getStats().resolvedConflicts,
            aggregationTime: Date.now() - startTime,
            groupCount: this.grouping.enabled ? Object.keys(this.groupNodes(outputNodes)).length : 0
        };
    }
    
    /**
     * 获取聚合统计信息
     * @returns {object} - 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            conflictResolverStats: this.conflictResolver.getStats(),
            activeFilters: Array.from(this.activeFilters),
            configuration: this.config
        };
    }
    
    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            lastAggregation: null,
            totalInputNodes: 0,
            totalOutputNodes: 0,
            filteredOutNodes: 0,
            conflictsResolved: 0,
            aggregationTime: 0,
            groupCount: 0
        };
        
        this.conflictResolver.resetStats();
    }
    
    /**
     * 添加常用过滤器
     */
    addCommonFilters() {
        // 只保留活跃节点
        this.addFilter('activeOnly', (node) => node.metadata.isActive);
        
        // 过滤指定类型的节点
        this.addFilter('typeFilter', (node) => {
            const allowedTypes = ['ss', 'vless', 'vmess', 'trojan', 'hysteria2'];
            return allowedTypes.includes(node.type);
        });
        
        // 过滤包含特定标签的节点
        this.addFilter('tagFilter', (node) => {
            const excludedTags = ['test', 'expired', 'broken'];
            return !node.metadata.tags.some(tag => excludedTags.includes(tag));
        });
        
        // 过滤重复的服务器地址
        const seenServers = new Set();
        this.addFilter('uniqueServer', (node) => {
            const serverKey = `${node.config.server}:${node.config.port}`;
            if (seenServers.has(serverKey)) {
                return false;
            }
            seenServers.add(serverKey);
            return true;
        });
    }
    
    /**
     * 预览聚合结果（不实际执行）
     * @param {Map<string, ProxyNode[]>} sourceNodes - 源节点映射
     * @param {object} options - 选项
     * @returns {object} - 预览结果
     */
    previewAggregation(sourceNodes, options = {}) {
        const preview = {
            inputSummary: {},
            estimatedOutput: {},
            conflicts: null,
            filters: Array.from(this.activeFilters),
            configuration: { ...this.config, ...options }
        };
        
        // 输入摘要
        let totalInputNodes = 0;
        for (const [sourceId, nodes] of sourceNodes) {
            totalInputNodes += nodes.length;
            preview.inputSummary[sourceId] = nodes.length;
        }
        preview.inputSummary.total = totalInputNodes;
        
        // 收集所有节点用于分析
        const allNodes = this.collectAllNodes(sourceNodes, { ...this.config, ...options });
        
        // 冲突预览
        if (this.config.enableConflictResolution) {
            preview.conflicts = this.conflictResolver.previewResolution(allNodes);
        }
        
        // 估算最终节点数
        let estimatedCount = allNodes.length;
        if (preview.conflicts) {
            estimatedCount = preview.conflicts.estimatedFinalCount;
        }
        
        preview.estimatedOutput = {
            afterConflictResolution: estimatedCount,
            afterFiltering: estimatedCount, // 简化估算
            final: Math.min(estimatedCount, options.maxNodes || estimatedCount)
        };
        
        return preview;
    }
}

// 导出类和枚举
module.exports = {
    NodeAggregator,
    AggregationMode,
    SortBy
}; 