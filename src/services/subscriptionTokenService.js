const crypto = require('crypto');
const db = require('../db');

/**
 * 生成随机Token
 * @returns {string} 生成的随机Token
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 为用户创建一个新的订阅Token
 * @param {number} userId - 用户ID
 * @param {string} name - Token名称
 * @param {string[]} configTypes - 允许访问的配置类型数组
 * @param {Date|null} expiresAt - 过期时间，null表示永不过期
 * @returns {Promise<Object>} 创建的Token对象
 */
async function createToken(userId, name, configTypes, expiresAt = null) {
    const token = generateToken();
    const configTypesJson = JSON.stringify(configTypes);
    
    // 插入数据库
    const result = await db.run(
        `INSERT INTO subscription_tokens (user_id, token, name, config_types, created_at, expires_at, is_active)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1)`,
        [userId, token, name, configTypesJson, expiresAt]
    );
    
    return {
        id: result.lastID,
        userId,
        token,
        name,
        configTypes,
        expiresAt,
        isActive: true
    };
}

/**
 * 获取用户的所有订阅Token
 * @param {number} userId - 用户ID
 * @returns {Promise<Object[]>} Token对象数组
 */
async function getTokensByUserId(userId) {
    const tokens = await db.all(
        `SELECT id, user_id, token, name, config_types, created_at, expires_at, is_active
         FROM subscription_tokens 
         WHERE user_id = ?`,
        [userId]
    );
    
    return tokens.map(token => ({
        id: token.id,
        userId: token.user_id,
        token: token.token,
        name: token.name,
        configTypes: JSON.parse(token.config_types),
        createdAt: token.created_at,
        expiresAt: token.expires_at,
        isActive: !!token.is_active
    }));
}

/**
 * 通过Token字符串查找Token
 * @param {string} tokenString - 要查找的Token字符串
 * @returns {Promise<Object|null>} 找到的Token对象，未找到则返回null
 */
async function getTokenByString(tokenString) {
    const token = await db.get(
        `SELECT id, user_id, token, name, config_types, created_at, expires_at, is_active
         FROM subscription_tokens 
         WHERE token = ?`,
        [tokenString]
    );
    
    if (!token) return null;
    
    return {
        id: token.id,
        userId: token.user_id,
        token: token.token,
        name: token.name,
        configTypes: JSON.parse(token.config_types),
        createdAt: token.created_at,
        expiresAt: token.expires_at,
        isActive: !!token.is_active
    };
}

/**
 * 更新Token信息
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于验证所有权）
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<boolean>} 更新是否成功
 */
async function updateToken(id, userId, updates) {
    const validFields = ['name', 'config_types', 'expires_at', 'is_active'];
    const setClause = [];
    const params = [];
    
    // 构建SET子句
    for (const [key, value] of Object.entries(updates)) {
        // 转换字段名为下划线格式
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (validFields.includes(dbKey)) {
            if (dbKey === 'config_types' && Array.isArray(value)) {
                // 配置类型需要JSON序列化
                setClause.push(`${dbKey} = ?`);
                params.push(JSON.stringify(value));
            } else {
                setClause.push(`${dbKey} = ?`);
                params.push(value);
            }
        }
    }
    
    if (setClause.length === 0) return false;
    
    // 添加ID和用户ID作为条件
    params.push(id, userId);
    
    const result = await db.run(
        `UPDATE subscription_tokens 
         SET ${setClause.join(', ')} 
         WHERE id = ? AND user_id = ?`,
        params
    );
    
    return result.changes > 0;
}

/**
 * 删除Token
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于验证所有权）
 * @returns {Promise<boolean>} 删除是否成功
 */
async function deleteToken(id, userId) {
    const result = await db.run(
        `DELETE FROM subscription_tokens 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
    );
    
    return result.changes > 0;
}

/**
 * 重新生成Token字符串
 * @param {number} id - Token ID
 * @param {number} userId - 用户ID（用于验证所有权）
 * @returns {Promise<Object|null>} 更新后的Token对象，失败则返回null
 */
async function regenerateToken(id, userId) {
    const newToken = generateToken();
    
    const result = await db.run(
        `UPDATE subscription_tokens 
         SET token = ? 
         WHERE id = ? AND user_id = ?`,
        [newToken, id, userId]
    );
    
    if (result.changes === 0) return null;
    
    // 获取更新后的Token详情
    return await db.get(
        `SELECT id, user_id, token, name, config_types, created_at, expires_at, is_active
         FROM subscription_tokens 
         WHERE id = ?`,
        [id]
    ).then(token => {
        if (!token) return null;
        return {
            id: token.id,
            userId: token.user_id,
            token: token.token,
            name: token.name,
            configTypes: JSON.parse(token.config_types),
            createdAt: token.created_at,
            expiresAt: token.expires_at,
            isActive: !!token.is_active
        };
    });
}

/**
 * 检查Token是否有权限访问指定的配置类型
 * @param {string} tokenString - Token字符串
 * @param {string} configType - 配置类型
 * @returns {Promise<boolean>} 是否有权限
 */
async function isTokenAuthorized(tokenString, configType) {
    const token = await getTokenByString(tokenString);
    
    if (!token) return false;
    if (!token.isActive) return false;
    
    // 检查是否过期
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return false;
    }
    
    // 检查配置类型是否在允许列表中
    return token.configTypes.includes(configType);
}

module.exports = {
    createToken,
    getTokensByUserId,
    getTokenByString,
    updateToken,
    deleteToken,
    regenerateToken,
    isTokenAuthorized
}; 