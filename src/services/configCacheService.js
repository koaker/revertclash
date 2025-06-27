const crypto = require('crypto');
const db = require('../db');

/**
 * 配置缓存服务
 * 负责管理订阅配置的缓存存储、检索和验证
 */
class ConfigCacheService {
    
    /**
     * 计算内容的哈希值，用于验证配置内容的完整性
     * @param {string} content - 配置内容
     * @returns {string} SHA256哈希值
     */
    static calculateHash(content) {
        return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    }

    /**
     * 保存或更新订阅配置缓存
     * @param {string} subscriptionName - 订阅名称
     * @param {string} configContent - 配置内容（YAML字符串）
     * @param {number} expireHours - 缓存过期时间（小时），默认24小时
     * @returns {Promise<object>} 保存结果
     */
    static async saveConfig(subscriptionName, configContent, expireHours = 24) {
        try {
            if (!subscriptionName || !configContent) {
                throw new Error('订阅名称和配置内容不能为空');
            }

            const contentHash = this.calculateHash(configContent);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + expireHours * 60 * 60 * 1000);

            // 检查是否已存在该订阅的缓存
            const existing = await db.get(
                'SELECT id, content_hash FROM subscription_configs WHERE subscription_name = ?',
                [subscriptionName]
            );

            if (existing) {
                // 如果内容哈希相同，只更新时间戳（确保is_cached标记正确）
                if (existing.content_hash === contentHash) {
                    await db.run(`
                        UPDATE subscription_configs 
                        SET last_fetch_success = ?, last_fetch_attempt = ?, 
                            fetch_success_count = fetch_success_count + 1,
                            expires_at = ?, is_cached = 1
                        WHERE subscription_name = ?
                    `, [now.toISOString(), now.toISOString(), expiresAt.toISOString(), subscriptionName]);
                    
                    console.log(`配置缓存已更新时间戳: ${subscriptionName}`);
                    return { updated: true, contentChanged: false };
                } else {
                    // 内容有变化，更新所有字段（包括is_cached标记）
                    await db.run(`
                        UPDATE subscription_configs 
                        SET config_content = ?, content_hash = ?, last_updated = ?, 
                            last_fetch_success = ?, last_fetch_attempt = ?,
                            fetch_success_count = fetch_success_count + 1,
                            expires_at = ?, is_cached = 1
                        WHERE subscription_name = ?
                    `, [configContent, contentHash, now.toISOString(), now.toISOString(), 
                        now.toISOString(), expiresAt.toISOString(), subscriptionName]);
                    
                    console.log(`配置缓存已更新内容: ${subscriptionName}`);
                    return { updated: true, contentChanged: true };
                }
            } else {
                // 新增缓存记录（包括is_cached标记）
                await db.run(`
                    INSERT INTO subscription_configs 
                    (subscription_name, config_content, content_hash, last_updated, 
                     last_fetch_success, last_fetch_attempt, fetch_success_count, expires_at, is_cached)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1)
                `, [subscriptionName, configContent, contentHash, now.toISOString(), 
                    now.toISOString(), now.toISOString(), expiresAt.toISOString()]);
                
                console.log(`新增配置缓存: ${subscriptionName}`);
                return { created: true, contentChanged: true };
            }
        } catch (err) {
            console.error(`保存配置缓存失败 (${subscriptionName}):`, err.message);
            throw err;
        }
    }

    /**
     * 记录获取失败的尝试
     * @param {string} subscriptionName - 订阅名称
     * @param {string} errorMessage - 错误信息
     * @returns {Promise<void>}
     */
    static async recordFetchFailure(subscriptionName, errorMessage) {
        try {
            const now = new Date();
            
            // 检查是否已存在该订阅的记录
            const existing = await db.get(
                'SELECT id FROM subscription_configs WHERE subscription_name = ?',
                [subscriptionName]
            );

            if (existing) {
                // 更新失败次数和最后尝试时间
                await db.run(`
                    UPDATE subscription_configs 
                    SET last_fetch_attempt = ?, fetch_failure_count = fetch_failure_count + 1
                    WHERE subscription_name = ?
                `, [now.toISOString(), subscriptionName]);
            } else {
                // 创建新记录（但没有配置内容）
                await db.run(`
                    INSERT INTO subscription_configs 
                    (subscription_name, config_content, content_hash, last_fetch_attempt, 
                     fetch_failure_count, is_cached)
                    VALUES (?, '', '', ?, 1, 0)
                `, [subscriptionName, now.toISOString()]);
            }
            
            console.log(`记录获取失败: ${subscriptionName} - ${errorMessage}`);
        } catch (err) {
            console.error(`记录获取失败时出错 (${subscriptionName}):`, err.message);
        }
    }

    /**
     * 获取缓存的配置
     * @param {string} subscriptionName - 订阅名称
     * @param {boolean} includeExpired - 是否包含过期的缓存，默认false
     * @returns {Promise<object|null>} 缓存的配置对象或null
     */
    static async getConfig(subscriptionName, includeExpired = false) {
        try {
            let sql = `
                SELECT * FROM subscription_configs 
                WHERE subscription_name = ? AND is_cached = 1 AND config_content != ''
            `;
            
            if (!includeExpired) {
                sql += ` AND (expires_at IS NULL OR expires_at > datetime('now'))`;
            }

            const config = await db.get(sql, [subscriptionName]);
            
            if (config) {
                // 验证内容完整性
                const calculatedHash = this.calculateHash(config.config_content);
                if (calculatedHash !== config.content_hash) {
                    console.warn(`配置缓存哈希验证失败: ${subscriptionName}`);
                    return null;
                }
                
                console.log(`从缓存读取配置: ${subscriptionName}`);
                return {
                    subscriptionName: config.subscription_name,
                    configContent: config.config_content,
                    lastUpdated: new Date(config.last_updated),
                    lastFetchSuccess: config.last_fetch_success ? new Date(config.last_fetch_success) : null,
                    isExpired: config.expires_at ? new Date(config.expires_at) < new Date() : false,
                    fetchSuccessCount: config.fetch_success_count,
                    fetchFailureCount: config.fetch_failure_count
                };
            }
            
            return null;
        } catch (err) {
            console.error(`获取配置缓存失败 (${subscriptionName}):`, err.message);
            return null;
        }
    }

    /**
     * 获取所有缓存的配置列表
     * @param {boolean} includeExpired - 是否包含过期的缓存
     * @returns {Promise<Array>} 配置列表
     */
    static async getAllConfigs(includeExpired = false) {
        try {
            let sql = `
                SELECT subscription_name, last_updated, last_fetch_success, last_fetch_attempt,
                       fetch_success_count, fetch_failure_count, expires_at, is_cached,
                       CASE WHEN config_content = '' THEN 0 ELSE 1 END as has_content
                FROM subscription_configs
            `;
            
            if (!includeExpired) {
                sql += ` WHERE expires_at IS NULL OR expires_at > datetime('now')`;
            }
            
            sql += ` ORDER BY last_updated DESC`;

            const configs = await db.all(sql);
            
            return configs.map(config => ({
                subscriptionName: config.subscription_name,
                lastUpdated: config.last_updated ? new Date(config.last_updated) : null,
                lastFetchSuccess: config.last_fetch_success ? new Date(config.last_fetch_success) : null,
                lastFetchAttempt: config.last_fetch_attempt ? new Date(config.last_fetch_attempt) : null,
                fetchSuccessCount: config.fetch_success_count,
                fetchFailureCount: config.fetch_failure_count,
                isExpired: config.expires_at ? new Date(config.expires_at) < new Date() : false,
                isCached: Boolean(config.is_cached),
                hasContent: Boolean(config.has_content)
            }));
        } catch (err) {
            console.error('获取所有配置缓存失败:', err.message);
            return [];
        }
    }

    /**
     * 删除指定订阅的缓存
     * @param {string} subscriptionName - 订阅名称
     * @returns {Promise<boolean>} 是否成功删除
     */
    static async deleteConfig(subscriptionName) {
        try {
            const result = await db.run(
                'DELETE FROM subscription_configs WHERE subscription_name = ?',
                [subscriptionName]
            );
            
            if (result.changes > 0) {
                console.log(`已删除配置缓存: ${subscriptionName}`);
                return true;
            } else {
                console.log(`配置缓存不存在: ${subscriptionName}`);
                return false;
            }
        } catch (err) {
            console.error(`删除配置缓存失败 (${subscriptionName}):`, err.message);
            return false;
        }
    }

    /**
     * 清理过期的缓存
     * @param {number} daysOld - 清理多少天前的过期缓存，默认7天
     * @returns {Promise<number>} 清理的记录数
     */
    static async cleanupExpiredConfigs(daysOld = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const result = await db.run(`
                DELETE FROM subscription_configs 
                WHERE expires_at < datetime('now', '-${daysOld} days')
            `);
            
            if (result.changes > 0) {
                console.log(`已清理 ${result.changes} 个过期的配置缓存`);
            }
            
            return result.changes;
        } catch (err) {
            console.error('清理过期配置缓存失败:', err.message);
            return 0;
        }
    }

    /**
     * 获取缓存统计信息
     * @returns {Promise<object>} 统计信息
     */
    static async getCacheStats() {
        try {
            const stats = await db.get(`
                SELECT 
                    COUNT(*) as total_count,
                    SUM(CASE WHEN is_cached = 1 AND config_content != '' THEN 1 ELSE 0 END) as cached_count,
                    SUM(CASE WHEN expires_at < datetime('now') THEN 1 ELSE 0 END) as expired_count,
                    SUM(fetch_success_count) as total_success_count,
                    SUM(fetch_failure_count) as total_failure_count,
                    AVG(fetch_success_count) as avg_success_count,
                    AVG(fetch_failure_count) as avg_failure_count
                FROM subscription_configs
            `);
            
            return {
                totalSubscriptions: stats.total_count || 0,
                cachedSubscriptions: stats.cached_count || 0,
                expiredSubscriptions: stats.expired_count || 0,
                totalSuccessCount: stats.total_success_count || 0,
                totalFailureCount: stats.total_failure_count || 0,
                avgSuccessCount: Math.round((stats.avg_success_count || 0) * 100) / 100,
                avgFailureCount: Math.round((stats.avg_failure_count || 0) * 100) / 100
            };
        } catch (err) {
            console.error('获取缓存统计信息失败:', err.message);
            return {
                totalSubscriptions: 0,
                cachedSubscriptions: 0,
                expiredSubscriptions: 0,
                totalSuccessCount: 0,
                totalFailureCount: 0,
                avgSuccessCount: 0,
                avgFailureCount: 0
            };
        }
    }
}

module.exports = ConfigCacheService; 