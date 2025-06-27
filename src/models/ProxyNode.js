const crypto = require('crypto');

/**
 * 标准化代理节点结构体
 * 用于统一不同协议和来源的节点数据表示
 */
class ProxyNode {
    /**
     * 构造函数
     * @param {string} sourceId - 配置源标识
     * @param {object} originalConfig - 原始Clash配置对象
     */
    constructor(sourceId, originalConfig) {
        // 验证必要参数
        if (!sourceId || typeof sourceId !== 'string') {
            throw new Error('sourceId 必须是有效的字符串');
        }
        
        if (!originalConfig || typeof originalConfig !== 'object') {
            throw new Error('originalConfig 必须是有效的配置对象');
        }
        
        if (!originalConfig.name || !originalConfig.type || !originalConfig.server || !originalConfig.port) {
            throw new Error('配置对象缺少必要字段: name, type, server, port');
        }
        
        // 基本标识信息
        this.id = this.generateId(sourceId, originalConfig);
        this.sourceId = sourceId;
        this.sourceVersion = null;  // 将由ConfigSource设置
        
        // 节点基本信息
        this.name = originalConfig.name;
        this.type = originalConfig.type;
        this.config = this.normalizeConfig(originalConfig);
        
        // 元数据
        this.metadata = {
            createdAt: new Date(),
            lastUpdated: new Date(),
            isActive: true,
            tags: [],
            priority: 0,
            originalName: originalConfig.name  // 保存原始名称
        };
        
        // 缓存原始配置的哈希，用于检测变化
        this.configHash = this.calculateConfigHash(originalConfig);
    }
    
    /**
     * 生成节点的全局唯一ID
     * @param {string} sourceId - 配置源标识
     * @param {object} config - 节点配置
     * @returns {string} - 唯一ID
     */
    generateId(sourceId, config) {
        // 使用关键参数生成稳定的哈希ID
        let keyData = `${sourceId}:${config.server}:${config.port}:${config.type}`;
        
        // 添加协议特定的关键参数
        switch (config.type) {
            case 'ss':
                keyData += `:${config.cipher || ''}:${config.password || ''}`;
                break;
            case 'vless':
            case 'vmess':
                keyData += `:${config.uuid || config.id || ''}`;
                break;
            case 'trojan':
                keyData += `:${config.password || ''}`;
                break;
            case 'hysteria2':
                keyData += `:${config.password || config.auth || ''}`;
                break;
        }
        
        return crypto.createHash('md5').update(keyData).digest('hex');
    }
    
    /**
     * 标准化配置对象，移除元数据，只保留Clash所需配置
     * @param {object} originalConfig - 原始配置
     * @returns {object} - 标准化的Clash配置
     */
    normalizeConfig(originalConfig) {
        // 创建配置副本，移除可能的污染字段
        const cleanConfig = { ...originalConfig };
        
        // 移除内部字段
        delete cleanConfig.sourceId;
        delete cleanConfig.metadata;
        delete cleanConfig.id;  // 避免与节点ID冲突
        
        // 确保必要字段存在
        if (!cleanConfig.udp && cleanConfig.udp !== false) {
            cleanConfig.udp = true;  // 默认启用UDP
        }
        
        return cleanConfig;
    }
    
    /**
     * 计算配置的哈希值，用于检测配置变化
     * @param {object} config - 配置对象
     * @returns {string} - 配置哈希
     */
    calculateConfigHash(config) {
        // 创建用于哈希的稳定字符串表示
        const hashData = JSON.stringify(this.normalizeConfig(config), Object.keys(config).sort());
        return crypto.createHash('sha256').update(hashData).digest('hex');
    }
    
    /**
     * 更新节点配置
     * @param {object} newConfig - 新的配置对象
     * @returns {boolean} - 是否发生了变化
     */
    updateConfig(newConfig) {
        const newHash = this.calculateConfigHash(newConfig);
        
        if (newHash === this.configHash) {
            return false;  // 配置未发生变化
        }
        
        // 更新配置
        this.name = newConfig.name;
        this.type = newConfig.type;
        this.config = this.normalizeConfig(newConfig);
        this.configHash = newHash;
        
        // 更新元数据
        this.metadata.lastUpdated = new Date();
        
        return true;  // 配置已更新
    }
    
    /**
     * 获取用于显示的节点名称（包含源前缀）
     * @returns {string} - 显示名称
     */
    getDisplayName() {
        return `${this.sourceId}|-|${this.name}`;
    }
    
    /**
     * 获取用于Clash配置的对象
     * @returns {object} - Clash代理配置对象
     */
    toClashConfig() {
        return {
            name: this.getDisplayName(),
            ...this.config
        };
    }
    
    /**
     * 设置节点的活跃状态
     * @param {boolean} isActive - 是否活跃
     */
    setActive(isActive) {
        this.metadata.isActive = Boolean(isActive);
        this.metadata.lastUpdated = new Date();
    }
    
    /**
     * 添加标签
     * @param {string|string[]} tags - 标签或标签数组
     */
    addTags(tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        const uniqueTags = [...new Set([...this.metadata.tags, ...tagArray])];
        this.metadata.tags = uniqueTags;
    }
    
    /**
     * 移除标签
     * @param {string|string[]} tags - 要移除的标签
     */
    removeTags(tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        this.metadata.tags = this.metadata.tags.filter(tag => !tagArray.includes(tag));
    }
    
    /**
     * 设置节点优先级
     * @param {number} priority - 优先级数值（越大越优先）
     */
    setPriority(priority) {
        this.metadata.priority = Number(priority) || 0;
    }
    
    /**
     * 检查节点是否匹配给定的过滤条件
     * @param {object} filters - 过滤条件
     * @returns {boolean} - 是否匹配
     */
    matchesFilters(filters) {
        if (filters.type && this.type !== filters.type) {
            return false;
        }
        
        if (filters.sourceId && this.sourceId !== filters.sourceId) {
            return false;
        }
        
        if (filters.tags && filters.tags.length > 0) {
            const hasRequiredTags = filters.tags.every(tag => 
                this.metadata.tags.includes(tag)
            );
            if (!hasRequiredTags) {
                return false;
            }
        }
        
        if (filters.name && !this.name.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 获取节点的简要信息
     * @returns {object} - 节点摘要
     */
    getSummary() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            name: this.name,
            type: this.type,
            server: this.config.server,
            port: this.config.port,
            isActive: this.metadata.isActive,
            priority: this.metadata.priority,
            tags: this.metadata.tags,
            lastUpdated: this.metadata.lastUpdated
        };
    }
    
    /**
     * 序列化为JSON
     * @returns {object} - 可序列化的对象
     */
    toJSON() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            sourceVersion: this.sourceVersion,
            name: this.name,
            type: this.type,
            config: this.config,
            metadata: this.metadata,
            configHash: this.configHash
        };
    }
    
    /**
     * 从JSON对象创建ProxyNode实例
     * @param {object} jsonData - JSON数据
     * @returns {ProxyNode} - ProxyNode实例
     */
    static fromJSON(jsonData) {
        const node = Object.create(ProxyNode.prototype);
        Object.assign(node, jsonData);
        return node;
    }
}

module.exports = ProxyNode; 