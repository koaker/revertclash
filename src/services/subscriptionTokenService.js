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
        if (!isValidInput(userId, 'userId')) {
            logSecurityEvent('INVALID_USER_ID', { userId });
            throw new Error('无效的用户ID');
        }

        const tokens = await db.query(
            `SELECT id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount" 
            FROM subscription_tokens 
            WHERE user_id = $1 
            ORDER BY created_at DESC`,
            [userId]
        );
        
        // 确保configTypes是数组
        return tokens.rows.map(token => ({
            ...token,
            configTypes: ensureConfigTypesArray(token.configTypes)
        }));
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
        if (!isValidInput(tokenString, 'string')) {
            logSecurityEvent('INVALID_TOKEN_STRING', { tokenString: 'REDACTED' });
            throw new Error('无效的Token字符串');
        }

        const result = await db.query(
            `SELECT id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount" 
            FROM subscription_tokens 
            WHERE token = $1`,
            [tokenString]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        // 确保configTypes是数组
        const token = result.rows[0];
        return {
            ...token,
            configTypes: ensureConfigTypesArray(token.configTypes)
        };
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
        
        // 确保configTypes以JSON字符串形式存储
        const configTypesJson = JSON.stringify(configTypes);
        
        const result = await db.query(
            `INSERT INTO subscription_tokens 
            (user_id, name, token, config_types, created_at, expires_at, last_accessed, is_active, access_count) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id, user_id as "userId", name, token, config_types as "configTypes", 
            created_at as "createdAt", expires_at as "expiresAt", last_accessed as "lastAccessed", 
            is_active as "isActive", access_count as "accessCount"`,
            [userId, name, token, configTypesJson, now, expiresAt, null, true, 0]
        );
        
        // 确保configTypes是数组
        const createdToken = result.rows[0];
        return {
            ...createdToken,
            configTypes: ensureConfigTypesArray(createdToken.configTypes)
        };
    } catch (err) {
        console.error('创建订阅Token失败:', err);
        throw err;
    }
}

/**
 * 确保configTypes是数组格式
 * @param {any} configTypes - 可能是数组、字符串或对象
 * @returns {Array} 配置类型数组
 */
function ensureConfigTypesArray(configTypes) {
    // 如果已经是数组，直接返回
    if (Array.isArray(configTypes)) {
        return configTypes;
    }
    
    // 如果是字符串，尝试解析
    if (typeof configTypes === 'string') {
        try {
            const parsed = JSON.parse(configTypes);
            return Array.isArray(parsed) ? parsed : ['config'];
        } catch (e) {
            console.error('解析configTypes字符串失败:', e.message);
            return ['config'];
        }
    }
    
    // 如果是对象但不是数组（如[object Object]），尝试获取可用的键值
    if (configTypes && typeof configTypes === 'object') {
        try {
            // 尝试将对象转换为数组
            const asArray = Object.values(configTypes);
            return asArray.length > 0 ? asArray : ['config'];
        } catch (e) {
            console.error('处理configTypes对象失败:', e.message);
            return ['config'];
        }
    }
    
    // 默认值
    return ['config'];
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
            // 确保configTypes以JSON字符串形式存储
            queryParams.push(JSON.stringify(updates.configTypes));
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
        
        if (result.rows.length === 0) {
            return null;
        }
        
        // 确保configTypes是数组
        const regeneratedToken = result.rows[0];
        return {
            ...regeneratedToken,
            configTypes: ensureConfigTypesArray(regeneratedToken.configTypes)
        };
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
        
        // 确保每个token的configTypes都是数组
        return result.rows.map(token => ({
            ...token,
            configTypes: ensureConfigTypesArray(token.configTypes)
        }));
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

/**
 * IP访问频率限制器
 * 用于限制单个IP的访问频率，防止滥用
 */
const accessLimiter = {
    // 存储IP和访问记录的映射
    ipMap: new Map(),
    
    // 访问窗口时间（毫秒）
    windowMs: 60 * 1000, // 1分钟
    
    // 窗口内最大请求次数
    maxRequests: 30,
    
    /**
     * 检查指定IP是否超过访问限制
     * @param {string} ip - 客户端IP地址
     * @returns {boolean} 是否允许访问
     */
    checkAccess(ip) {
        const now = Date.now();
        
        // 如果IP没有记录，创建新记录
        if (!this.ipMap.has(ip)) {
            this.ipMap.set(ip, {
                count: 1,
                firstAccess: now,
                lastAccess: now
            });
            return true;
        }
        
        const record = this.ipMap.get(ip);
        
        // 如果已经超过窗口时间，重置计数
        if (now - record.firstAccess > this.windowMs) {
            record.count = 1;
            record.firstAccess = now;
            record.lastAccess = now;
            return true;
        }
        
        // 更新访问记录
        record.count++;
        record.lastAccess = now;
        
        // 检查是否超过限制
        return record.count <= this.maxRequests;
    },
    
    /**
     * 清理过期的IP记录
     */
    cleanup() {
        const now = Date.now();
        const expireTime = now - this.windowMs * 2; // 清理超过2个窗口时间的记录
        
        for (const [ip, record] of this.ipMap.entries()) {
            if (record.lastAccess < expireTime) {
                this.ipMap.delete(ip);
            }
        }
    }
};

// 定期清理过期记录
setInterval(() => accessLimiter.cleanup(), 10 * 60 * 1000); // 每10分钟清理一次

/**
 * 检查Token是否有权限访问指定的配置类型
 * @param {string} tokenString - Token字符串
 * @param {string} configType - 配置类型
 * @param {string} clientIp - 客户端IP地址
 * @returns {Promise<boolean>} 是否有权限
 */
async function isTokenAuthorized(tokenString, configType, clientIp) {
    try {
        // 检查请求频率，这里用全局accessLimiter，而不是this.accessLimiter
        if (!accessLimiter.checkAccess(clientIp)) {
            logSecurityEvent('ACCESS_LIMIT_EXCEEDED', { clientIp, tokenString: 'REDACTED' });
            return false;
        }

        // 获取Token
        const token = await getTokenByString(tokenString);
        
        // 如果Token不存在
        if (!token) {
            logSecurityEvent('TOKEN_NOT_FOUND', { tokenString: 'REDACTED' });
            return false;
        }
        
        // 检查Token是否过期
        if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
            logSecurityEvent('TOKEN_EXPIRED', { tokenId: token.id, userId: token.userId });
            return false;
        }
        
        // 检查Token是否激活
        if (!token.isActive) {
            logSecurityEvent('TOKEN_INACTIVE', { tokenId: token.id, userId: token.userId });
            return false;
        }
        
        // 检查配置类型是否被允许
        const configTypes = ensureConfigTypesArray(token.configTypes);
        
        if (!configTypes.includes(configType)) {
            logSecurityEvent('CONFIG_TYPE_NOT_ALLOWED', { 
                tokenId: token.id, 
                userId: token.userId,
                requestedType: configType,
                allowedTypes: configTypes
            });
            return false;
        }
        
        // 更新最后访问时间
        await updateLastAccessed(token.id);
        
        return true;
    } catch (err) {
        console.error('验证Token授权失败:', err);
        return false;
    }
}

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
    accessLimiter,
    isTokenAuthorized
}; 