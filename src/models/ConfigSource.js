const crypto = require('crypto');
const ProxyNode = require('./ProxyNode');

/**
 * 配置源状态枚举
 */
const SourceStatus = {
    PENDING: 'pending',      // 等待处理
    ACTIVE: 'active',        // 正常活跃
    ERROR: 'error',          // 发生错误
    DISABLED: 'disabled'     // 已禁用
};

/**
 * 配置源类型枚举
 */
const SourceType = {
    URL: 'url',             // URL订阅源
    LOCAL: 'local',         // 本地文件源
    MANUAL: 'manual'        // 手动上传源
};

/**
 * 配置源结构体
 * 管理单个配置源的内容、版本和节点数据
 */
class ConfigSource {
    /**
     * 构造函数
     * @param {string} id - 配置源唯一标识
     * @param {string} type - 配置源类型 (url/local/manual)
     * @param {object} config - 配置源的配置信息
     */
    constructor(id, type, config) {
        // 验证参数
        if (!id || typeof id !== 'string') {
            throw new Error('配置源ID必须是有效的字符串');
        }
        
        if (!Object.values(SourceType).includes(type)) {
            throw new Error(`无效的配置源类型: ${type}`);
        }
        
        if (!config || typeof config !== 'object') {
            throw new Error('配置源配置必须是有效的对象');
        }
        
        // 基本信息
        this.id = id;
        this.type = type;
        this.config = config;
        console.log(`创建配置源: ${this.id}, 类型: ${this.type} 配置:`, this.config);
        
        // 版本和状态管理
        this.version = null;
        this.contentHash = null;
        this.lastUpdate = null;
        this.lastSuccess = null;
        this.status = SourceStatus.PENDING;
        
        // 节点管理
        this.nodes = new Map();  // nodeId -> ProxyNode
        this.nodeCount = 0;
        
        // 错误和统计信息
        this.errorInfo = null;
        this.successCount = 0;
        this.errorCount = 0;
        this.lastError = null;
        
        // 元数据
        this.metadata = {
            createdAt: new Date(),
            description: config.description || '',
            tags: config.tags || [],
            enabled: config.enabled !== false,  // 默认启用
            priority: config.priority || 0
        };
    }
    
    /**
     * 计算内容版本哈希
     * @param {string} content - 原始内容
     * @returns {string} - 版本哈希
     */
    calculateVersion(content) {
        if (!content || typeof content !== 'string') {
            return null;
        }
        
        // 标准化内容（移除首尾空白和统一换行符）
        const normalizedContent = content.trim().replace(/\r\n/g, '\n');
        return crypto.createHash('sha256').update(normalizedContent).digest('hex');
    }
    
    /**
     * 更新配置源内容
     * @param {string} rawContent - 原始内容
     * @param {object} parserManager - 解析器管理器
     * @returns {Promise<object>} - 更新结果
     */
    async updateContent(rawContent, parserManager) {
        const updateStartTime = new Date();
        
        try {
            // 计算新版本
            const newVersion = this.calculateVersion(rawContent);
            const contentChanged = newVersion !== this.version;
            
            // 如果内容未发生变化，直接返回
            if (!contentChanged && this.status === SourceStatus.ACTIVE) {
                console.log(`配置源 ${this.id} 内容未发生变化，跳过处理`);
                return {
                    changed: false,
                    nodes: Array.from(this.nodes.values()),
                    nodeCount: this.nodeCount,
                    version: this.version
                };
            }
            
            // 解析新内容
            console.log(`开始解析配置源 ${this.id} 的内容...`);
            //console.log(`原始内容: ${rawContent}`);
            const parsedNodes = await parserManager.parse(rawContent);
            
            if (!parsedNodes || parsedNodes.length === 0) {
                throw new Error('解析失败或无有效节点');
            }
            
            // 创建新的节点集合
            const newNodes = new Map();
            const proxyNodes = [];
            
            for (const nodeConfig of parsedNodes) {
                try {
                    const proxyNode = new ProxyNode(this.id, nodeConfig);
                    proxyNode.sourceVersion = newVersion;
                    
                    newNodes.set(proxyNode.id, proxyNode);
                    proxyNodes.push(proxyNode);
                } catch (nodeError) {
                    console.warn(`创建节点失败 (${nodeConfig.name || 'unknown'}):`, nodeError.message);
                    // 继续处理其他节点，不因单个节点失败而中止
                }
            }
            
            if (newNodes.size === 0) {
                throw new Error('没有成功创建任何有效节点');
            }
            
            // 更新节点集合
            this.nodes.clear();
            this.nodes = newNodes;
            this.nodeCount = this.nodes.size;
            
            // 更新版本和状态信息
            this.version = newVersion;
            this.contentHash = newVersion;
            this.lastUpdate = updateStartTime;
            this.lastSuccess = updateStartTime;
            this.status = SourceStatus.ACTIVE;
            this.successCount += 1;
            this.errorInfo = null;
            this.lastError = null;
            
            console.log(`配置源 ${this.id} 更新成功: ${this.nodeCount} 个节点`);
            
            return {
                changed: contentChanged,
                nodes: proxyNodes,
                nodeCount: this.nodeCount,
                version: this.version,
                previousNodeCount: contentChanged ? 0 : this.nodeCount  // 简化处理
            };
            
        } catch (error) {
            // 记录错误信息
            this.status = SourceStatus.ERROR;
            this.errorInfo = error.message;
            this.lastError = updateStartTime;
            this.errorCount += 1;
            
            console.error(`配置源 ${this.id} 更新失败:`, error.message);
            
            // 如果是首次处理失败，抛出错误
            if (!this.lastSuccess) {
                throw error;
            }
            
            // 如果之前有成功的节点，保留它们
            console.warn(`配置源 ${this.id} 保留之前的 ${this.nodeCount} 个节点`);
            return {
                changed: false,
                nodes: Array.from(this.nodes.values()),
                nodeCount: this.nodeCount,
                version: this.version,
                error: error.message
            };
        }
    }
    
    /**
     * 获取所有活跃节点
     * @returns {ProxyNode[]} - 活跃节点数组
     */
    getActiveNodes() {
        return Array.from(this.nodes.values()).filter(node => node.metadata.isActive);
    }
    
    /**
     * 根据条件筛选节点
     * @param {object} filters - 筛选条件
     * @returns {ProxyNode[]} - 筛选结果
     */
    filterNodes(filters) {
        return Array.from(this.nodes.values()).filter(node => node.matchesFilters(filters));
    }
    
    /**
     * 获取指定ID的节点
     * @param {string} nodeId - 节点ID
     * @returns {ProxyNode|null} - 节点对象或null
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId) || null;
    }
    
    /**
     * 禁用配置源
     */
    disable() {
        this.status = SourceStatus.DISABLED;
        this.metadata.enabled = false;
        
        // 将所有节点设为非活跃状态
        for (const node of this.nodes.values()) {
            node.setActive(false);
        }
    }
    
    /**
     * 启用配置源
     */
    enable() {
        if (this.status === SourceStatus.DISABLED) {
            this.status = this.lastSuccess ? SourceStatus.ACTIVE : SourceStatus.PENDING;
            this.metadata.enabled = true;
            
            // 重新激活所有节点
            for (const node of this.nodes.values()) {
                node.setActive(true);
            }
        }
    }
    
    /**
     * 清空所有节点
     */
    clearNodes() {
        this.nodes.clear();
        this.nodeCount = 0;
        this.version = null;
        this.contentHash = null;
    }
    
    /**
     * 获取配置源的统计信息
     * @returns {object} - 统计信息
     */
    getStats() {
        const activeNodes = this.getActiveNodes();
        const nodesByType = {};
        
        for (const node of this.nodes.values()) {
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
        }
        
        return {
            id: this.id,
            type: this.type,
            status: this.status,
            totalNodes: this.nodeCount,
            activeNodes: activeNodes.length,
            nodesByType,
            successCount: this.successCount,
            errorCount: this.errorCount,
            lastUpdate: this.lastUpdate,
            lastSuccess: this.lastSuccess,
            lastError: this.lastError,
            version: this.version,
            enabled: this.metadata.enabled
        };
    }
    
    /**
     * 获取配置源的详细信息
     * @returns {object} - 详细信息
     */
    getDetails() {
        return {
            id: this.id,
            type: this.type,
            config: this.config,
            status: this.status,
            version: this.version,
            nodeCount: this.nodeCount,
            errorInfo: this.errorInfo,
            metadata: this.metadata,
            stats: this.getStats()
        };
    }
    
    /**
     * 检查配置源是否可用
     * @returns {boolean} - 是否可用
     */
    isAvailable() {
        return this.metadata.enabled && 
               this.status !== SourceStatus.DISABLED && 
               this.nodeCount > 0;
    }
    
    /**
     * 检查配置源是否健康
     * @returns {boolean} - 是否健康
     */
    isHealthy() {
        const now = new Date();
        const timeSinceLastSuccess = this.lastSuccess ? 
            (now - this.lastSuccess) / (1000 * 60 * 60) : Infinity;  // 小时
        
        return this.status === SourceStatus.ACTIVE && 
               this.metadata.enabled &&
               this.nodeCount > 0 &&
               timeSinceLastSuccess < 48;  // 48小时内有成功更新
    }
    
    /**
     * 序列化为JSON
     * @returns {object} - 可序列化的对象
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            config: this.config,
            version: this.version,
            contentHash: this.contentHash,
            lastUpdate: this.lastUpdate,
            lastSuccess: this.lastSuccess,
            status: this.status,
            nodeCount: this.nodeCount,
            errorInfo: this.errorInfo,
            successCount: this.successCount,
            errorCount: this.errorCount,
            lastError: this.lastError,
            metadata: this.metadata,
            nodes: Array.from(this.nodes.values()).map(node => node.toJSON())
        };
    }
    
    /**
     * 从JSON对象创建ConfigSource实例
     * @param {object} jsonData - JSON数据
     * @returns {ConfigSource} - ConfigSource实例
     */
    static fromJSON(jsonData) {
        const source = new ConfigSource(jsonData.id, jsonData.type, jsonData.config);
        
        // 恢复状态数据
        Object.assign(source, {
            version: jsonData.version,
            contentHash: jsonData.contentHash,
            lastUpdate: jsonData.lastUpdate ? new Date(jsonData.lastUpdate) : null,
            lastSuccess: jsonData.lastSuccess ? new Date(jsonData.lastSuccess) : null,
            status: jsonData.status,
            nodeCount: jsonData.nodeCount,
            errorInfo: jsonData.errorInfo,
            successCount: jsonData.successCount,
            errorCount: jsonData.errorCount,
            lastError: jsonData.lastError ? new Date(jsonData.lastError) : null,
            metadata: jsonData.metadata
        });
        
        // 恢复节点数据
        if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
            source.nodes.clear();
            for (const nodeData of jsonData.nodes) {
                const node = ProxyNode.fromJSON(nodeData);
                source.nodes.set(node.id, node);
            }
        }
        
        return source;
    }
}

// 导出类和枚举
module.exports = {
    ConfigSource,
    SourceStatus,
    SourceType
}; 