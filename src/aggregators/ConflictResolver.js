/**
 * 冲突解决策略枚举
 */
const ConflictStrategy = {
    PRIORITY: 'priority',           // 按优先级选择
    LATEST: 'latest',              // 选择最新的
    FIRST: 'first',                // 选择第一个
    MERGE: 'merge',                // 尝试合并
    RENAME: 'rename',              // 重命名后保留所有
    SOURCE_PRIORITY: 'source_priority'  // 按配置源优先级
};

/**
 * 冲突解决器
 * 处理来自不同配置源的节点名称冲突
 */
class ConflictResolver {
    constructor() {
        // 默认策略配置
        this.defaultStrategy = ConflictStrategy.RENAME;
        
        // 策略配置映射
        this.strategyConfig = new Map();
        
        // 配置源优先级映射
        this.sourcePriorities = new Map();
        
        // 统计信息
        this.stats = {
            totalConflicts: 0,
            resolvedConflicts: 0,
            strategiesUsed: {},
            lastReset: new Date()
        };
    }
    
    /**
     * 设置默认冲突解决策略
     * @param {string} strategy - 策略名称
     */
    setDefaultStrategy(strategy) {
        if (!Object.values(ConflictStrategy).includes(strategy)) {
            throw new Error(`无效的冲突解决策略: ${strategy}`);
        }
        this.defaultStrategy = strategy;
    }
    
    /**
     * 为特定节点名称模式设置策略
     * @param {RegExp|string} pattern - 节点名称模式
     * @param {string} strategy - 策略名称
     */
    setStrategyForPattern(pattern, strategy) {
        if (!Object.values(ConflictStrategy).includes(strategy)) {
            throw new Error(`无效的冲突解决策略: ${strategy}`);
        }
        this.strategyConfig.set(pattern, strategy);
    }
    
    /**
     * 设置配置源优先级
     * @param {string} sourceId - 配置源ID
     * @param {number} priority - 优先级（数值越大优先级越高）
     */
    setSourcePriority(sourceId, priority) {
        this.sourcePriorities.set(sourceId, Number(priority) || 0);
    }
    
    /**
     * 批量设置配置源优先级
     * @param {object} priorities - 优先级映射对象
     */
    setSourcePriorities(priorities) {
        for (const [sourceId, priority] of Object.entries(priorities)) {
            this.setSourcePriority(sourceId, priority);
        }
    }
    
    /**
     * 解决节点冲突
     * @param {ProxyNode[]} conflictingNodes - 冲突的节点数组
     * @returns {ProxyNode[]} - 解决冲突后的节点数组
     */
    resolve(conflictingNodes) {
        if (!conflictingNodes || conflictingNodes.length <= 1) {
            return conflictingNodes || [];
        }
        
        // 按显示名称分组找出冲突
        const nameGroups = new Map();
        
        for (const node of conflictingNodes) {
            const displayName = node.getDisplayName();
            if (!nameGroups.has(displayName)) {
                nameGroups.set(displayName, []);
            }
            nameGroups.get(displayName).push(node);
        }
        
        const resolvedNodes = [];
        
        for (const [displayName, nodes] of nameGroups) {
            if (nodes.length === 1) {
                // 无冲突，直接添加
                resolvedNodes.push(nodes[0]);
            } else {
                // 有冲突，需要解决
                this.stats.totalConflicts += 1;
                
                const strategy = this.getStrategyForName(displayName);
                const resolved = this.applyStrategy(strategy, nodes);
                
                resolvedNodes.push(...resolved);
                this.stats.resolvedConflicts += 1;
                
                // 统计策略使用情况
                this.stats.strategiesUsed[strategy] = (this.stats.strategiesUsed[strategy] || 0) + 1;
                
                console.log(`解决冲突节点 "${displayName}": ${nodes.length} -> ${resolved.length} (策略: ${strategy})`);
            }
        }
        
        return resolvedNodes;
    }
    
    /**
     * 获取指定名称应使用的策略
     * @param {string} name - 节点名称
     * @returns {string} - 策略名称
     * @private
     */
    getStrategyForName(name) {
        for (const [pattern, strategy] of this.strategyConfig) {
            if (pattern instanceof RegExp) {
                if (pattern.test(name)) {
                    return strategy;
                }
            } else if (typeof pattern === 'string') {
                if (name.includes(pattern)) {
                    return strategy;
                }
            }
        }
        return this.defaultStrategy;
    }
    
    /**
     * 应用指定策略解决冲突
     * @param {string} strategy - 策略名称
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    applyStrategy(strategy, nodes) {
        switch (strategy) {
            case ConflictStrategy.PRIORITY:
                return this.resolvByPriority(nodes);
            
            case ConflictStrategy.LATEST:
                return this.resolveByLatest(nodes);
            
            case ConflictStrategy.FIRST:
                return this.resolveByFirst(nodes);
            
            case ConflictStrategy.MERGE:
                return this.resolveByMerge(nodes);
            
            case ConflictStrategy.RENAME:
                return this.resolveByRename(nodes);
            
            case ConflictStrategy.SOURCE_PRIORITY:
                return this.resolveBySourcePriority(nodes);
            
            default:
                console.warn(`未知的冲突解决策略: ${strategy}，使用重命名策略`);
                return this.resolveByRename(nodes);
        }
    }
    
    /**
     * 按节点优先级解决冲突
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolvByPriority(nodes) {
        // 找出优先级最高的节点
        let maxPriority = -Infinity;
        let selectedNodes = [];
        
        for (const node of nodes) {
            const priority = node.metadata.priority;
            if (priority > maxPriority) {
                maxPriority = priority;
                selectedNodes = [node];
            } else if (priority === maxPriority) {
                selectedNodes.push(node);
            }
        }
        
        // 如果仍有多个节点具有相同优先级，使用最新策略
        if (selectedNodes.length > 1) {
            return this.resolveByLatest(selectedNodes);
        }
        
        return selectedNodes;
    }
    
    /**
     * 按最新时间解决冲突
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolveByLatest(nodes) {
        // 按最后更新时间排序，选择最新的
        const sortedNodes = [...nodes].sort((a, b) => 
            new Date(b.metadata.lastUpdated) - new Date(a.metadata.lastUpdated)
        );
        
        return [sortedNodes[0]];
    }
    
    /**
     * 选择第一个节点
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolveByFirst(nodes) {
        return [nodes[0]];
    }
    
    /**
     * 尝试合并节点配置
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolveByMerge(nodes) {
        // 检查是否可以合并（相同服务器和端口）
        const baseNode = nodes[0];
        const canMerge = nodes.every(node => 
            node.config.server === baseNode.config.server && 
            node.config.port === baseNode.config.port &&
            node.type === baseNode.type
        );
        
        if (!canMerge) {
            // 无法合并，回退到重命名策略
            console.warn(`节点无法合并，使用重命名策略: ${baseNode.getDisplayName()}`);
            return this.resolveByRename(nodes);
        }
        
        // 合并配置（保留最新的配置，合并标签和元数据）
        const latestNode = this.resolveByLatest(nodes)[0];
        
        // 合并所有节点的标签
        const allTags = new Set();
        for (const node of nodes) {
            for (const tag of node.metadata.tags) {
                allTags.add(tag);
            }
        }
        
        // 设置合并后的标签
        latestNode.metadata.tags = Array.from(allTags);
        
        // 添加合并标记
        latestNode.addTags(['merged', 'conflict-resolved']);
        
        return [latestNode];
    }
    
    /**
     * 通过重命名保留所有节点
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolveByRename(nodes) {
        const renamedNodes = [];
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            if (i === 0) {
                // 第一个节点保持原名
                renamedNodes.push(node);
            } else {
                // 后续节点添加后缀
                const originalName = node.name;
                const suffix = this.generateUniqueSuffix(node, i);
                
                // 创建重命名后的节点
                const renamedNode = { ...node };
                renamedNode.name = `${originalName} ${suffix}`;
                renamedNode.metadata = {
                    ...node.metadata,
                    originalName: originalName,
                    renamed: true,
                    renameSuffix: suffix
                };
                
                renamedNodes.push(renamedNode);
            }
        }
        
        return renamedNodes;
    }
    
    /**
     * 按配置源优先级解决冲突
     * @param {ProxyNode[]} nodes - 冲突节点数组
     * @returns {ProxyNode[]} - 解决后的节点数组
     * @private
     */
    resolveBySourcePriority(nodes) {
        // 按配置源优先级排序
        const sortedNodes = [...nodes].sort((a, b) => {
            const priorityA = this.sourcePriorities.get(a.sourceId) || 0;
            const priorityB = this.sourcePriorities.get(b.sourceId) || 0;
            return priorityB - priorityA; // 降序
        });
        
        // 选择优先级最高的配置源的节点
        const highestPriority = this.sourcePriorities.get(sortedNodes[0].sourceId) || 0;
        const topNodes = sortedNodes.filter(node => 
            (this.sourcePriorities.get(node.sourceId) || 0) === highestPriority
        );
        
        // 如果仍有多个节点，使用最新策略
        if (topNodes.length > 1) {
            return this.resolveByLatest(topNodes);
        }
        
        return topNodes;
    }
    
    /**
     * 生成唯一后缀
     * @param {ProxyNode} node - 节点对象
     * @param {number} index - 索引
     * @returns {string} - 唯一后缀
     * @private
     */
    generateUniqueSuffix(node, index) {
        // 根据不同的信息生成后缀
        const server = node.config.server;
        const sourceId = node.sourceId;
        
        // 尝试使用服务器信息
        if (server && server !== 'unknown') {
            const serverParts = server.split('.');
            if (serverParts.length >= 2) {
                return `[${serverParts[serverParts.length - 2]}.${serverParts[serverParts.length - 1]}]`;
            }
            return `[${server}]`;
        }
        
        // 使用配置源ID
        if (sourceId && sourceId !== 'unknown') {
            return `[${sourceId}]`;
        }
        
        // 最后使用索引
        return `[${index + 1}]`;
    }
    
    /**
     * 获取冲突解决统计信息
     * @returns {object} - 统计信息
     */
    getStats() {
        return {
            ...this.stats,
            conflictRate: this.stats.totalConflicts > 0 ? 
                (this.stats.resolvedConflicts / this.stats.totalConflicts * 100).toFixed(2) + '%' : 
                '0%'
        };
    }
    
    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalConflicts: 0,
            resolvedConflicts: 0,
            strategiesUsed: {},
            lastReset: new Date()
        };
    }
    
    /**
     * 检测潜在冲突
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {object[]} - 冲突报告
     */
    detectConflicts(nodes) {
        const nameGroups = new Map();
        const conflicts = [];
        
        // 按显示名称分组
        for (const node of nodes) {
            const displayName = node.getDisplayName();
            if (!nameGroups.has(displayName)) {
                nameGroups.set(displayName, []);
            }
            nameGroups.get(displayName).push(node);
        }
        
        // 找出冲突
        for (const [displayName, groupNodes] of nameGroups) {
            if (groupNodes.length > 1) {
                conflicts.push({
                    name: displayName,
                    nodeCount: groupNodes.length,
                    sources: groupNodes.map(node => node.sourceId),
                    strategy: this.getStrategyForName(displayName),
                    nodes: groupNodes.map(node => ({
                        id: node.id,
                        sourceId: node.sourceId,
                        server: node.config.server,
                        port: node.config.port,
                        priority: node.metadata.priority,
                        lastUpdated: node.metadata.lastUpdated
                    }))
                });
            }
        }
        
        return conflicts;
    }
    
    /**
     * 获取冲突预览（不实际解决）
     * @param {ProxyNode[]} nodes - 节点数组
     * @returns {object} - 冲突预览
     */
    previewResolution(nodes) {
        const conflicts = this.detectConflicts(nodes);
        const preview = {
            totalNodes: nodes.length,
            conflictCount: conflicts.length,
            totalConflictingNodes: conflicts.reduce((sum, conflict) => sum + conflict.nodeCount, 0),
            estimatedFinalCount: 0,
            conflicts: conflicts,
            strategySummary: {}
        };
        
        // 估算解决后的节点数量
        let estimatedCount = nodes.length;
        
        for (const conflict of conflicts) {
            const strategy = conflict.strategy;
            
            // 统计策略使用
            preview.strategySummary[strategy] = (preview.strategySummary[strategy] || 0) + 1;
            
            // 估算节点数量变化
            switch (strategy) {
                case ConflictStrategy.RENAME:
                    // 重命名策略不减少节点
                    break;
                case ConflictStrategy.MERGE:
                case ConflictStrategy.PRIORITY:
                case ConflictStrategy.LATEST:
                case ConflictStrategy.FIRST:
                case ConflictStrategy.SOURCE_PRIORITY:
                    // 这些策略会减少到1个节点
                    estimatedCount -= (conflict.nodeCount - 1);
                    break;
            }
        }
        
        preview.estimatedFinalCount = estimatedCount;
        
        return preview;
    }
}

// 导出类和枚举
module.exports = {
    ConflictResolver,
    ConflictStrategy
}; 