const yaml = require('js-yaml');

/**
 * 节点管理器类 (重构版 v2.0)
 * 负责管理ProxyNode结构体数组，与新架构ConfigManager对接
 */
class NodeManager {
    constructor() {
        this.nodes = new Map(); // 存储节点信息: Map<string, ProxyNodeWrapper>
        this.selectedNodes = new Set(); // 存储选中的节点名称
        this.configManager = null; // ConfigManager引用
        this.lastUpdateTime = null; // 最后更新时间
        this.sourceNodeMap = new Map(); // 配置源到节点的映射
    }

    /**
     * 设置ConfigManager引用，实现数据联通
     * @param {ConfigManager} configManager - 配置管理器实例
     */
    setConfigManager(configManager) {
        this.configManager = configManager;
        
        // 监听配置更新事件，自动刷新节点数据
        if (configManager && configManager.sourceManager) {
            configManager.sourceManager.on('configsUpdated', () => {
                this.refreshNodesFromConfigManager();
            });
        }
    }

    /**
     * 从ConfigManager刷新节点数据
     * @returns {Promise<Array>} - 格式化的节点列表
     */
    async refreshNodesFromConfigManager() {
        if (!this.configManager) {
            console.warn('NodeManager: ConfigManager未设置，无法刷新节点数据');
            return this.getNodes();
        }

        try {
            console.log('NodeManager: 开始从ConfigManager刷新节点数据...');
            
            // 检查ConfigManager是否已初始化
            if (!this.configManager.isInitialized) {
                console.log('NodeManager: ConfigManager未初始化，正在初始化...');
                await this.configManager.initialize();
            }
            
            // 先检查是否有聚合的节点数据
            let aggregatedNodes = this.configManager.nodeAggregator.getAggregatedNodes();
            let sourceNodes = this.configManager.nodeAggregator.getNodesBySource();
            
            console.log(`NodeManager: 当前聚合节点数量: ${aggregatedNodes.length}`);
            
            // 如果没有聚合数据或数据过期，强制触发配置处理
            if (aggregatedNodes.length === 0 || this.shouldRefreshData()) {
                console.log('NodeManager: 聚合数据为空或过期，触发配置处理...');
                
                try {
                    // 强制处理配置以触发节点聚合
                    await this.configManager.processConfigs();
                    
                    // 重新获取聚合数据
                    aggregatedNodes = this.configManager.nodeAggregator.getAggregatedNodes();
                    sourceNodes = this.configManager.nodeAggregator.getNodesBySource();
                    
                    console.log(`NodeManager: 配置处理后聚合节点数量: ${aggregatedNodes.length}`);
                    
                } catch (processError) {
                    console.error('NodeManager: 配置处理失败:', processError.message);
                    // 继续尝试获取现有数据
                }
            }
            
            // 如果仍然没有数据，尝试直接从配置源收集
            if (aggregatedNodes.length === 0) {
                console.warn('NodeManager: 仍无聚合数据，尝试直接从配置源收集节点...');
                aggregatedNodes = await this.collectDirectFromSources();
                sourceNodes = new Map(); // 空的源映射
            }
            
            console.log(`NodeManager: 最终获取到 ${aggregatedNodes.length} 个节点用于更新`);
            
            return this.updateNodesFromStructArray(aggregatedNodes, sourceNodes);
            
        } catch (error) {
            console.error('NodeManager: 从ConfigManager刷新节点失败:', error.message);
            console.error('NodeManager: 错误详情:', error.stack);
            return this.getNodes();
        }
    }

    /**
     * 检查是否应该刷新数据
     * @returns {boolean} - 是否需要刷新
     * @private
     */
    shouldRefreshData() {
        if (!this.lastUpdateTime) {
            return true;
        }
        
        // 如果超过5分钟没有更新，认为需要刷新
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.lastUpdateTime < fiveMinutesAgo;
    }

    /**
     * 直接从配置源收集节点（降级方案）
     * @returns {Promise<Array>} - 收集到的节点数组
     * @private
     */
    async collectDirectFromSources() {
        try {
            console.log('NodeManager: 尝试直接从配置源收集节点...');
            
            const sources = this.configManager.sourceManager.getAllSources();
            const allNodes = [];
            
            for (const source of sources) {
                try {
                    if (source.nodeCount > 0 && source.nodes) {
                        console.log(`NodeManager: 从配置源 ${source.id} 收集到 ${source.nodes.length} 个节点`);
                        allNodes.push(...source.nodes);
                    }
                } catch (sourceError) {
                    console.error(`NodeManager: 从配置源 ${source.id} 收集节点失败:`, sourceError.message);
                }
            }
            
            console.log(`NodeManager: 直接收集总计 ${allNodes.length} 个节点`);
            return allNodes;
            
        } catch (error) {
            console.error('NodeManager: 直接从配置源收集节点失败:', error.message);
            return [];
        }
    }

    /**
     * 从ProxyNode结构体数组更新节点数据
     * @param {ProxyNode[]} proxyNodes - ProxyNode结构体数组
     * @param {Map} sourceNodeMap - 配置源到节点的映射 (可选)
     * @returns {Array} - 格式化的节点列表
     */
    updateNodesFromStructArray(proxyNodes, sourceNodeMap = null) {
        if (!Array.isArray(proxyNodes)) {
            console.error('NodeManager: 输入参数必须是ProxyNode数组');
            return this.getNodes();
        }

        // 保存旧的选择状态
        const oldSelection = new Set(this.selectedNodes);
        
        // 清空现有节点
        this.nodes.clear();
        this.sourceNodeMap.clear();

        // 处理ProxyNode结构体数组
        proxyNodes.forEach(proxyNode => {
            try {
                // 检查是否是有效的ProxyNode结构体
                if (!this.isValidProxyNode(proxyNode)) {
                    console.warn('NodeManager: 发现无效的ProxyNode结构体:', proxyNode);
                    return;
                }

                // 创建节点包装器
                const nodeWrapper = {
                    // 基本信息
                    name: proxyNode.getDisplayName(),
                    type: proxyNode.type,
                    server: proxyNode.config.server,
                    port: proxyNode.config.port,
                    
                    // 扩展信息
                    id: proxyNode.id,
                    source: proxyNode.sourceId,
                    version: proxyNode.sourceVersion,
                    createTime: proxyNode.metadata.createdAt,
                    updateTime: proxyNode.metadata.lastUpdated,
                    
                    // 状态信息
                    selected: oldSelection.has(proxyNode.getDisplayName()),
                    
                    // 完整结构体引用
                    proxyNode: proxyNode,
                    
                    // 生成的Clash配置
                    clashConfig: proxyNode.toClashConfig(),
                    
                    // 摘要信息
                    summary: proxyNode.getSummary()
                };

                // 存储节点
                this.nodes.set(nodeWrapper.name, nodeWrapper);
                
                // 更新选择状态
                if (nodeWrapper.selected) {
                    this.selectedNodes.add(nodeWrapper.name);
                }

                // 维护配置源映射
                if (nodeWrapper.source) {
                    if (!this.sourceNodeMap.has(nodeWrapper.source)) {
                        this.sourceNodeMap.set(nodeWrapper.source, []);
                    }
                    this.sourceNodeMap.get(nodeWrapper.source).push(nodeWrapper);
                }
                
            } catch (error) {
                console.error('NodeManager: 处理ProxyNode时出错:', error.message);
            }
        });

        // 处理配置源映射信息
        if (sourceNodeMap) {
            this.updateSourceMapping(sourceNodeMap);
        }

        this.lastUpdateTime = new Date();
        
        console.log(`NodeManager: 更新完成，共加载 ${this.nodes.size} 个节点，来自 ${this.sourceNodeMap.size} 个配置源`);
        
        return this.getNodes();
    }

    /**
     * 验证ProxyNode结构体的有效性
     * @param {Object} proxyNode - 待验证的对象
     * @returns {boolean} - 是否有效
     * @private
     */
    isValidProxyNode(proxyNode) {
        if (!proxyNode || typeof proxyNode !== 'object') return false;
        
        // 检查必要的方法
        const requiredMethods = ['getDisplayName', 'toClashConfig', 'getSummary'];
        for (const method of requiredMethods) {
            if (typeof proxyNode[method] !== 'function') {
                return false;
            }
        }
        
        // 检查基本属性 - 修复：server和port在config对象中
        return proxyNode.type && 
               proxyNode.config && 
               proxyNode.config.server && 
               proxyNode.config.port;
    }

    /**
     * 更新配置源映射
     * @param {Map} sourceNodeMap - 配置源到节点的映射
     * @private
     */
    updateSourceMapping(sourceNodeMap) {
        for (const [sourceId, nodes] of sourceNodeMap) {
            const wrapperNodes = nodes
                .filter(node => this.nodes.has(node.getDisplayName()))
                .map(node => this.nodes.get(node.getDisplayName()));
            
            if (wrapperNodes.length > 0) {
                this.sourceNodeMap.set(sourceId, wrapperNodes);
            }
        }
    }

    /**
     * 解析配置文件中的节点信息 (兼容性方法)
     * @param {Object|String} config - Clash配置对象或YAML字符串
     * @returns {Array} - 格式化的节点列表
     * @deprecated 建议使用updateNodesFromStructArray方法
     */
    async parseNodes(config) {
        console.warn('NodeManager.parseNodes已废弃，建议使用updateNodesFromStructArray');
        
        // 如果传入的是字符串，则解析为对象
        let configObj = config;
        if (typeof config === 'string') {
            try {
                configObj = yaml.load(config);
            } catch (err) {
                throw new Error('无效的YAML格式: ' + err.message);
            }
        }

        // 检查配置是否包含proxies部分
        if (!configObj.proxies || !Array.isArray(configObj.proxies)) {
            return [];
        }

        // 保存旧的选择状态
        const oldSelection = new Set(this.selectedNodes);
        
        // 清空现有节点
        this.nodes.clear();

        // 解析节点信息 (兼容性处理)
        configObj.proxies.forEach(proxy => {
            // 提取基本信息
            const node = {
                name: proxy.name,
                type: proxy.type,
                server: proxy.server,
                port: proxy.port,
                selected: oldSelection.has(proxy.name),
                
                // 兼容性字段
                details: { ...proxy },
                clashConfig: proxy,
                
                // 新增字段
                id: `legacy-${proxy.name}`,
                source: 'legacy-config',
                version: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            this.nodes.set(proxy.name, node);
            
            // 更新选择状态
            if (node.selected) {
                this.selectedNodes.add(node.name);
            }
        });

        this.lastUpdateTime = new Date();
        return this.getNodes();
    }

    /**
     * 获取节点列表
     * @returns {Array} - 节点列表
     */
    getNodes() {
        return Array.from(this.nodes.values()).map(wrapper => ({
            name: wrapper.name,
            type: wrapper.type,
            server: wrapper.server,
            port: wrapper.port,
            selected: wrapper.selected,
            source: wrapper.source,
            id: wrapper.id,
            version: wrapper.version,
            updateTime: wrapper.updateTime
        }));
    }

    /**
     * 获取节点详细信息
     * @param {String} nodeName - 节点名称
     * @returns {Object|null} - 节点详细信息
     */
    getNodeDetails(nodeName) {
        const wrapper = this.nodes.get(nodeName);
        if (!wrapper) return null;
        
        return {
            ...wrapper.clashConfig,
            metadata: {
                id: wrapper.id,
                source: wrapper.source,
                version: wrapper.version,
                createTime: wrapper.createTime,
                updateTime: wrapper.updateTime,
                summary: wrapper.summary
            }
        };
    }

    /**
     * 获取节点的ProxyNode结构体
     * @param {String} nodeName - 节点名称
     * @returns {ProxyNode|null} - ProxyNode结构体
     */
    getProxyNode(nodeName) {
        const wrapper = this.nodes.get(nodeName);
        return wrapper ? wrapper.proxyNode : null;
    }

    /**
     * 选择/取消选择节点
     * @param {String} nodeName - 节点名称
     * @returns {Boolean} - 操作后的选择状态
     */
    toggleNode(nodeName) {
        if (!this.nodes.has(nodeName)) {
            throw new Error(`节点 "${nodeName}" 不存在`);
        }

        const wrapper = this.nodes.get(nodeName);
        
        if (this.selectedNodes.has(nodeName)) {
            this.selectedNodes.delete(nodeName);
            wrapper.selected = false;
            return false;
        } else {
            this.selectedNodes.add(nodeName);
            wrapper.selected = true;
            return true;
        }
    }

    /**
     * 批量选择节点
     * @param {Array} nodeNames - 节点名称数组
     */
    selectNodes(nodeNames) {
        nodeNames.forEach(name => {
            if (this.nodes.has(name)) {
                this.selectedNodes.add(name);
                this.nodes.get(name).selected = true;
            }
        });
    }

    /**
     * 批量取消选择节点
     * @param {Array} nodeNames - 节点名称数组
     */
    deselectNodes(nodeNames) {
        nodeNames.forEach(name => {
            this.selectedNodes.delete(name);
            if (this.nodes.has(name)) {
                this.nodes.get(name).selected = false;
            }
        });
    }

    /**
     * 全选所有节点
     */
    selectAll() {
        this.nodes.forEach((wrapper, name) => {
            this.selectedNodes.add(name);
            wrapper.selected = true;
        });
    }

    /**
     * 取消选择所有节点
     */
    deselectAll() {
        this.selectedNodes.clear();
        this.nodes.forEach(wrapper => {
            wrapper.selected = false;
        });
    }

    /**
     * 获取选中的节点
     * @returns {Array} - 选中的节点列表
     */
    getSelectedNodes() {
        return this.getNodes().filter(node => node.selected);
    }

    /**
     * 获取选中节点的ProxyNode结构体数组
     * @returns {ProxyNode[]} - 选中的ProxyNode数组
     */
    getSelectedProxyNodes() {
        const selectedWrappers = Array.from(this.nodes.values())
            .filter(wrapper => wrapper.selected);
        
        return selectedWrappers
            .map(wrapper => wrapper.proxyNode)
            .filter(proxyNode => proxyNode);
    }

    /**
     * 按类型筛选节点
     * @param {String} type - 节点类型
     * @returns {Array} - 筛选后的节点列表
     */
    filterByType(type) {
        return this.getNodes().filter(node => node.type === type);
    }

    /**
     * 按配置源筛选节点
     * @param {String} source - 配置源ID
     * @returns {Array} - 筛选后的节点列表
     */
    filterBySource(source) {
        return this.getNodes().filter(node => node.source === source);
    }

    /**
     * 按名称搜索节点
     * @param {String} keyword - 搜索关键词
     * @returns {Array} - 搜索结果
     */
    searchByName(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.getNodes().filter(node => 
            node.name.toLowerCase().includes(lowerKeyword)
        );
    }

    /**
     * 获取配置源统计信息
     * @returns {Object} - 配置源统计
     */
    getSourceStats() {
        const stats = {};
        
        for (const [sourceId, nodes] of this.sourceNodeMap) {
            stats[sourceId] = {
                total: nodes.length,
                selected: nodes.filter(node => node.selected).length,
                types: [...new Set(nodes.map(node => node.type))]
            };
        }
        
        return stats;
    }

    /**
     * 获取节点管理器状态信息
     * @returns {Object} - 状态信息
     */
    getManagerStatus() {
        return {
            totalNodes: this.nodes.size,
            selectedNodes: this.selectedNodes.size,
            configSources: this.sourceNodeMap.size,
            lastUpdateTime: this.lastUpdateTime,
            hasConfigManager: !!this.configManager,
            sourceStats: this.getSourceStats()
        };
    }
}

module.exports = NodeManager;
