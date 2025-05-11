const crypto = require('crypto');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');

/**
 * 生成随机Token
 * @returns {string} 生成的随机Token
 */
function generateToken() {
    // 使用更强的加密随机性，增加Token长度为48字节（384位）
    return crypto.randomBytes(48).toString('hex');
}

/**
 * 安全地验证输入
 * @param {any} input - 需要验证的输入
 * @param {string} type - 输入类型
 * @returns {boolean} 输入是否有效
 */
function isValidInput(input, type) {
    if (input === null || input === undefined) return false;
    
    switch(type) {
        case 'id':
            // 确保ID是正整数
            return Number.isInteger(input) && input > 0;
        case 'userId':
            // 确保用户ID是正整数
            return Number.isInteger(input) && input > 0;
        case 'string':
            // 确保是非空字符串
            return typeof input === 'string' && input.trim().length > 0;
        case 'token':
            // 确保Token是有效的十六进制字符串
            return typeof input === 'string' && /^[0-9a-f]{96,}$/i.test(input);
        case 'array':
            // 确保是非空数组
            return Array.isArray(input) && input.length > 0;
        default:
            return false;
    }
}

/**
 * 记录安全事件
 * @param {string} action - 操作类型
 * @param {Object} details - 详细信息
 */
function logSecurityEvent(action, details) {
    const timestamp = new Date().toISOString();
    console.warn(`[安全警告] ${timestamp} - ${action}:`, details);
    // 这里可以添加更多的安全日志记录逻辑，如写入专门的安全日志文件
}

/**
 * 生成一个唯一的Token字符串
 * @returns {string} 生成的Token字符串
 */
function generateTokenString() {
    // 生成一个随机UUID并取其一部分，以生成合理长度的Token
    return uuidv4().replace(/-/g, '').substring(0, 32);
}

/**
 * 根据用户ID获取所有订阅Token
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} Token数组
 */
async function getTokensByUserId(userId) {
    try {
        const tokens = await db.query(
            `SELECT id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount" 
            FROM subscription_tokens 
            WHERE user_id = $1 
            ORDER BY created_at DESC`,
            [userId]
        );
        return tokens.rows;
    } catch (err) {
        console.error('获取用户订阅Token失败:', err);
        throw err;
    }
}

/**
 * 根据Token字符串获取Token详情
 * @param {string} tokenString - Token字符串
 * @returns {Promise<Object|null>} Token对象，如果未找到则返回null
 */
async function getTokenByString(tokenString) {
    try {
        const result = await db.query(
            `SELECT id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount" 
            FROM subscription_tokens 
            WHERE token = $1`,
            [tokenString]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
        console.error('根据字符串获取Token失败:', err);
        throw err;
    }
}

/**
 * 创建新的订阅Token
 * @param {number} userId - 用户ID
 * @param {string} name - Token名称
 * @param {Array} configTypes - 配置类型数组
 * @param {Date|null} expiresAt - 过期时间，可选
 * @returns {Promise<Object>} 创建的Token对象
 */
async function createToken(userId, name, configTypes, expiresAt = null) {
    try {
        const token = generateTokenString();
        const now = new Date();
        
        const result = await db.query(
            `INSERT INTO subscription_tokens 
            (user_id, name, token, config_types, created_at, expires_at, last_accessed, is_active, access_count) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount"`,
            [userId, name, token, configTypes, now, expiresAt, null, true, 0]
        );
        
        return result.rows[0];
    } catch (err) {
        console.error('创建订阅Token失败:', err);
        throw err;
    }
}

/**
 * 更新订阅Token
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于权限验证）
 * @param {Object} updates - 更新字段对象
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateToken(id, userId, updates) {
    try {
        // 首先检查Token是否存在且属于该用户
        const checkResult = await db.query(
            'SELECT id FROM subscription_tokens WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        
        if (checkResult.rows.length === 0) {
            return false;
        }
        
        // 构建更新语句
        let updateFields = [];
        let queryParams = [id];
        let paramCounter = 2;
        
        if (updates.name !== undefined) {
            updateFields.push(`name = $${paramCounter++}`);
            queryParams.push(updates.name);
        }
        
        if (updates.configTypes !== undefined) {
            updateFields.push(`config_types = $${paramCounter++}`);
            queryParams.push(updates.configTypes);
        }
        
        if (updates.expiresAt !== undefined) {
            updateFields.push(`expires_at = $${paramCounter++}`);
            queryParams.push(updates.expiresAt);
        }
        
        if (updates.isActive !== undefined) {
            updateFields.push(`is_active = $${paramCounter++}`);
            queryParams.push(updates.isActive);
        }
        
        // 如果没有要更新的字段，直接返回成功
        if (updateFields.length === 0) {
            return true;
        }
        
        const updateQuery = `
            UPDATE subscription_tokens 
            SET ${updateFields.join(', ')} 
            WHERE id = $1`;
        
        await db.query(updateQuery, queryParams);
        return true;
    } catch (err) {
        console.error('更新订阅Token失败:', err);
        throw err;
    }
}

/**
 * 删除订阅Token
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于权限验证）
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteToken(id, userId) {
    try {
        const result = await db.query(
            'DELETE FROM subscription_tokens WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        
        return result.rows.length > 0;
    } catch (err) {
        console.error('删除订阅Token失败:', err);
        throw err;
    }
}

/**
 * 重新生成Token字符串
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于权限验证）
 * @returns {Promise<Object|null>} 更新后的Token对象，如果未找到则返回null
 */
async function regenerateToken(id, userId) {
    try {
        const newToken = generateTokenString();
        
        const result = await db.query(
            `UPDATE subscription_tokens 
            SET token = $1, last_accessed = NULL, access_count = 0 
            WHERE id = $2 AND user_id = $3 
            RETURNING id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount"`,
            [newToken, id, userId]
        );
        
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (err) {
        console.error('重新生成Token失败:', err);
        throw err;
    }
}

/**
 * 更新Token的最后访问时间和访问计数
 * @param {number} id - Token ID
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateLastAccessed(id) {
    try {
        const now = new Date();
        
        await db.query(
            `UPDATE subscription_tokens 
            SET last_accessed = $1, access_count = access_count + 1 
            WHERE id = $2`,
            [now, id]
        );
        
        return true;
    } catch (err) {
        console.error('更新Token访问时间失败:', err);
        throw err;
    }
}

/**
 * 获取过去一段时间内的所有活跃Token的使用情况
 * @param {number} days - 要查询的天数
 * @returns {Promise<Array>} Token使用情况数组
 */
async function getTokenUsageStats(days = 30) {
    try {
        const cutoffDate = DateTime.now().minus({ days }).toJSDate();
        
        const result = await db.query(
            `SELECT t.id, t.user_id as "userId", t.name, t.token, t.config_types as "configTypes", 
            t.created_at as "createdAt", t.expires_at as "expiresAt", t.last_accessed as "lastAccessed", 
            t.is_active as "isActive", t.access_count as "accessCount", u.email as "userEmail"
            FROM subscription_tokens t
            JOIN users u ON t.user_id = u.id
            WHERE t.last_accessed IS NOT NULL AND t.last_accessed >= $1
            ORDER BY t.access_count DESC`,
            [cutoffDate]
        );
        
        return result.rows;
    } catch (err) {
        console.error('获取Token使用统计失败:', err);
        throw err;
    }
}

/**
 * 清理已过期且长时间未使用的Token
 * @param {number} unusedDays - 未使用的天数阈值
 * @returns {Promise<number>} 清理的Token数量
 */
async function cleanupExpiredTokens(unusedDays = 90) {
    try {
        const now = new Date();
        const cutoffDate = DateTime.now().minus({ days: unusedDays }).toJSDate();
        
        // 删除已过期且长时间未使用的Token
        const result = await db.query(
            `DELETE FROM subscription_tokens 
            WHERE (expires_at IS NOT NULL AND expires_at < $1) 
            OR (last_accessed IS NOT NULL AND last_accessed < $2)
            RETURNING id`,
            [now, cutoffDate]
        );
        
        return result.rows.length;
    } catch (err) {
        console.error('清理过期Token失败:', err);
        throw err;
    }
}

// 限制单个IP地址在一段时间内对订阅的访问次数，防止滥用
const accessLimiter = {
    // 存储IP访问记录：{ ip: { count: number, resetTime: timestamp } }
    ipRecords: {},
    // 单个IP在5分钟内的最大请求次数
    maxRequests: 300,
    // 重置时间间隔（毫秒），5分钟
    resetInterval: 5 * 60 * 1000,
    
    /**
     * 检查并记录IP访问
     * @param {string} ip - IP地址
     * @returns {boolean} 是否允许访问
     */
    checkAccess(ip) {
        const now = Date.now();
        
        // 初始化记录
        if (!this.ipRecords[ip]) {
            this.ipRecords[ip] = {
                count: 1,
                resetTime: now + this.resetInterval
            };
            return true;
        }
        
        const record = this.ipRecords[ip];
        
        // 检查是否需要重置
        if (now >= record.resetTime) {
            record.count = 1;
            record.resetTime = now + this.resetInterval;
            return true;
        }
        
        // 检查是否超出限制
        if (record.count >= this.maxRequests) {
            logSecurityEvent('IP访问频率过高', { ip, count: record.count });
            return false;
        }
        
        // 增加计数
        record.count++;
        return true;
    },
    
    /**
     * 清理过期记录
     */
    cleanup() {
        const now = Date.now();
        for (const ip in this.ipRecords) {
            if (now >= this.ipRecords[ip].resetTime) {
                delete this.ipRecords[ip];
            }
        }
    }
};

// 定期清理过期记录
setInterval(() => accessLimiter.cleanup(), 10 * 60 * 1000);

module.exports = {
    getTokensByUserId,
    getTokenByString,
    createToken,
    updateToken,
    deleteToken,
    regenerateToken,
    updateLastAccessed,
    getTokenUsageStats,
    cleanupExpiredTokens,
    accessLimiter
}; 