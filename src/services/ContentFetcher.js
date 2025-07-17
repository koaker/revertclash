const fs = require('fs').promises;
const path = require('path');
const { fetchSubscription } = require('../subscription/fetcher');
const ConfigCacheService = require('./configCacheService');
const { SourceType } = require('../models');

/**
 * 内容获取服务
 * 负责从不同类型的配置源获取原始内容
 */
class ContentFetcher {
    constructor() {
        this.timeout = 15000;  // 默认超时时间
        this.retryCount = 2;   // 重试次数
    }
    
    /**
     * 根据配置源类型获取内容
     * @param {ConfigSource} source - 配置源对象
     * @returns {Promise<object>} - 获取结果
     */
    async fetchContent(source) {
        switch (source.type) {
            case SourceType.URL:
                return await this.fetchUrlContent(source);
            
            case SourceType.LOCAL:
                return await this.fetchLocalContent(source);
            
            case SourceType.MANUAL:
                return await this.fetchManualContent(source);
            
            default:
                throw new Error(`不支持的配置源类型: ${source.type}`);
        }
    }
    
    /**
     * 获取URL订阅内容
     * @param {ConfigSource} source - URL类型的配置源
     * @returns {Promise<object>} - 获取结果
     */
    async fetchUrlContent(source) {
        const { url } = source.config;
        
        if (!url) {
            throw new Error('URL配置源缺少url参数');
        }
        
        console.log(`开始获取URL订阅: ${source.id} (${url})`);
        
        let lastError = null;
        
        // 尝试获取新内容（带重试）
        for (let attempt = 1; attempt <= this.retryCount; attempt++) {
            try {
                const result = await fetchSubscription(url, this.timeout);
                
                if (result.error) {
                    lastError = result.error;
                    console.warn(`获取订阅失败 (尝试 ${attempt}/${this.retryCount}): ${source.id} - ${result.error.message}`);
                    
                    if (attempt < this.retryCount) {
                        // 等待后重试
                        await this.sleep(1000 * attempt);
                        continue;
                    }
                } else if (result.content) {
                    // 获取成功，记录到缓存
                    try {
                        await ConfigCacheService.saveConfig(source.id, result.content);
                        console.log(`成功获取并缓存订阅: ${source.id}`);
                    } catch (cacheError) {
                        console.warn(`缓存订阅内容失败: ${source.id} - ${cacheError.message}`);
                        // 缓存失败不影响主流程
                    }
                    
                    return {
                        success: true,
                        content: result.content,
                        headers: result.headers,
                        fromCache: false,
                        source: 'network'
                    };
                }
            } catch (error) {
                lastError = error;
                console.warn(`网络请求异常 (尝试 ${attempt}/${this.retryCount}): ${source.id} - ${error.message}`);
                
                if (attempt < this.retryCount) {
                    await this.sleep(1000 * attempt);
                }
            }
        }
        
        // 所有尝试都失败，记录失败信息
        try {
            await ConfigCacheService.recordFetchFailure(source.id, lastError.message);
        } catch (recordError) {
            console.warn(`记录获取失败时出错: ${source.id} - ${recordError.message}`);
        }
        
        // 尝试从缓存恢复
        console.log(`尝试从缓存恢复订阅: ${source.id}`);
        const cacheResult = await this.recoverFromCache(source.id);
        
        if (cacheResult.success) {
            return cacheResult;
        }
        
        // 缓存恢复也失败，抛出原始错误
        throw lastError || new Error('获取URL内容失败且无可用缓存');
    }
    
    /**
     * 获取本地文件内容
     * @param {ConfigSource} source - 本地文件类型的配置源
     * @returns {Promise<object>} - 获取结果
     */
    async fetchLocalContent(source) {
        const { path: filePath } = source.config;
        
        if (!filePath) {
            throw new Error('本地文件配置源缺少path参数');
        }
        
        try {
            // 构建完整路径
            const fullPath = path.isAbsolute(filePath) ? 
                filePath : 
                path.join(__dirname, '..', '..', 'configs', filePath);
            
            console.log(`读取本地配置文件: ${source.id} (${fullPath})`);
            
            const content = await fs.readFile(fullPath, 'utf8');
            
            if (!content || content.trim().length === 0) {
                throw new Error('文件内容为空');
            }
            
            return {
                success: true,
                content: content,
                headers: null,
                fromCache: false,
                source: 'local_file',
                filePath: fullPath
            };
            
        } catch (error) {
            console.error(`读取本地文件失败: ${source.id} - ${error.message}`);
            throw new Error(`读取本地文件失败: ${error.message}`);
        }
    }
    
    /**
     * 获取手动上传的内容
     * @param {ConfigSource} source - 手动上传类型的配置源
     * @returns {Promise<object>} - 获取结果
     */
    async fetchManualContent(source) {
        try {
            console.log(`获取手动上传的配置: ${source.id}`);
            
            console.log(`手动上传内容: ${source.config}`);
            // 从缓存中获取手动上传的内容
            const cachedConfig = source.config.content;
            
            if (!cachedConfig) {
                throw new Error('未找到手动上传的配置内容');
            }
            
            return {
                success: true,
                content: cachedConfig,
                headers: null,
                fromCache: true,
                source: 'manual_upload',
                //lastUpdated: cachedConfig.lastUpdated
            };
            
        } catch (error) {
            console.error(`获取手动上传内容失败: ${source.id} - ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 从缓存中恢复内容
     * @param {string} sourceId - 配置源ID
     * @returns {Promise<object>} - 恢复结果
     */
    async recoverFromCache(sourceId) {
        try {
            const cachedConfig = await ConfigCacheService.getConfig(sourceId, true); // 包含过期的缓存
            
            if (cachedConfig && cachedConfig.configContent) {
                const isExpired = cachedConfig.isExpired;
                
                console.log(`从缓存恢复配置: ${sourceId} (${isExpired ? '已过期' : '有效'})`);
                
                return {
                    success: true,
                    content: cachedConfig.configContent,
                    headers: null,
                    fromCache: true,
                    source: 'cache_recovery',
                    isExpired: isExpired,
                    lastFetchSuccess: cachedConfig.lastFetchSuccess,
                    cacheDetails: {
                        lastUpdated: cachedConfig.lastUpdated,
                        fetchSuccessCount: cachedConfig.fetchSuccessCount,
                        fetchFailureCount: cachedConfig.fetchFailureCount
                    }
                };
            }
            
            return {
                success: false,
                error: '无可用的缓存内容'
            };
            
        } catch (error) {
            console.error(`缓存恢复失败: ${sourceId} - ${error.message}`);
            return {
                success: false,
                error: `缓存恢复失败: ${error.message}`
            };
        }
    }
    
    /**
     * 批量获取多个配置源的内容
     * @param {ConfigSource[]} sources - 配置源数组
     * @param {object} options - 选项
     * @returns {Promise<Map>} - 获取结果映射
     */
    async fetchMultiple(sources, options = {}) {
        const { parallel = true, maxConcurrency = 5 } = options;
        const results = new Map();
        
        if (parallel) {
            // 并行获取（限制并发数）
            const chunks = this.chunkArray(sources, maxConcurrency);
            
            for (const chunk of chunks) {
                const promises = chunk.map(async (source) => {
                    try {
                        const result = await this.fetchContent(source);
                        results.set(source.id, { success: true, ...result });
                    } catch (error) {
                        results.set(source.id, { 
                            success: false, 
                            error: error.message,
                            source: source
                        });
                    }
                });
                
                await Promise.all(promises);
            }
        } else {
            // 串行获取
            for (const source of sources) {
                try {
                    const result = await this.fetchContent(source);
                    results.set(source.id, { success: true, ...result });
                } catch (error) {
                    results.set(source.id, { 
                        success: false, 
                        error: error.message,
                        source: source
                    });
                }
            }
        }
        
        return results;
    }
    
    /**
     * 设置获取超时时间
     * @param {number} timeout - 超时时间（毫秒）
     */
    setTimeout(timeout) {
        this.timeout = Math.max(1000, timeout); // 最小1秒
    }
    
    /**
     * 设置重试次数
     * @param {number} count - 重试次数
     */
    setRetryCount(count) {
        this.retryCount = Math.max(0, Math.min(count, 5)); // 0-5次
    }
    
    /**
     * 检查配置源是否可达
     * @param {ConfigSource} source - 配置源
     * @returns {Promise<boolean>} - 是否可达
     */
    async isReachable(source) {
        try {
            await this.fetchContent(source);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 获取配置源的健康状态
     * @param {ConfigSource} source - 配置源
     * @returns {Promise<object>} - 健康状态信息
     */
    async getHealthStatus(source) {
        const startTime = Date.now();
        
        try {
            const result = await this.fetchContent(source);
            const responseTime = Date.now() - startTime;
            
            return {
                healthy: true,
                responseTime,
                source: result.source,
                fromCache: result.fromCache,
                lastCheck: new Date()
            };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                healthy: false,
                responseTime,
                error: error.message,
                lastCheck: new Date()
            };
        }
    }
    
    /**
     * 睡眠等待
     * @param {number} ms - 等待毫秒数
     * @returns {Promise} - Promise对象
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 将数组分块
     * @param {Array} array - 原数组
     * @param {number} size - 块大小
     * @returns {Array[]} - 分块后的数组
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = ContentFetcher; 