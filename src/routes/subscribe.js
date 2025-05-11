const express = require('express');
const router = express.Router();
const subscriptionTokenService = require('../services/subscriptionTokenService');
const configService = require('../services/configService');

/**
 * 安全地验证和清理输入
 * @param {string} input - 输入字符串
 * @returns {string} 清理后的字符串
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    // 替换可能导致XSS的字符
    return input.replace(/[<>&"']/g, (char) => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&#x27;';
            default: return char;
        }
    });
}

/**
 * 验证Token字符串是否符合格式
 * @param {string} token - Token字符串
 * @returns {boolean} 是否有效
 */
function isValidTokenString(token) {
    if (typeof token !== 'string' || token.length < 10 || token.length > 64) {
        return false;
    }
    // 只允许字母、数字和一些安全的字符
    return /^[a-zA-Z0-9_-]+$/.test(token);
}

/**
 * 验证配置类型是否有效
 * @param {string} configType - 配置类型
 * @returns {boolean} 是否有效
 */
function isValidConfigType(configType) {
    const validTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
    return validTypes.includes(configType);
}

/**
 * 非路由使用的辅助函数：获取并验证订阅Token
 * @param {string} tokenString - Token字符串
 * @returns {Promise<Object|null>} - 返回Token对象或null
 */
async function getAndValidateToken(tokenString) {
    if (!isValidTokenString(tokenString)) {
        return null;
    }
    
    try {
        const token = await subscriptionTokenService.getTokenByString(tokenString);
        
        if (!token) {
            return null;
        }
        
        // 检查Token是否已过期
        if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
            return null;
        }
        
        // 检查Token是否处于活动状态
        if (!token.isActive) {
            return null;
        }
        
        // 更新最后访问时间
        await subscriptionTokenService.updateLastAccessed(token.id);
        
        return token;
    } catch (error) {
        console.error('验证Token失败:', error);
        return null;
    }
}

/**
 * 通过订阅链接获取配置内容
 * GET /subscribe/:token/:type
 */
router.get('/:token/:type', async (req, res) => {
    try {
        const tokenString = req.params.token;
        const configType = req.params.type;
        
        // 验证Token格式
        if (!isValidTokenString(tokenString)) {
            return res.status(400).json({ error: '无效的订阅Token格式' });
        }
        
        // 验证配置类型
        if (!isValidConfigType(configType)) {
            return res.status(400).json({ error: '无效的配置类型' });
        }
        
        // 获取并验证Token
        const token = await getAndValidateToken(tokenString);
        
        if (!token) {
            return res.status(404).json({ error: '订阅Token不存在、已过期或已禁用' });
        }
        
        // 检查请求的配置类型是否被允许
        if (!token.configTypes.includes(configType)) {
            return res.status(403).json({ error: '该订阅Token不支持请求的配置类型' });
        }
        
        // 获取用户ID对应的配置
        const config = await configService.getLatestConfigByUserId(token.userId, configType);
        
        if (!config) {
            return res.status(404).json({ error: '未找到配置' });
        }
        
        // 如果是config类型，则设置正确的Content-Type和文件名
        if (configType === 'config') {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename="config.yaml"');
            return res.send(config.content);
        }
        
        // 其他类型按JSON返回
        res.setHeader('Content-Type', 'application/json');
        res.send(config.content);
    } catch (err) {
        console.error('获取订阅配置失败:', err);
        res.status(500).json({ error: '获取订阅配置失败: ' + sanitizeInput(err.message) });
    }
});

/**
 * 验证订阅Token是否有效
 * GET /subscribe/validate/:token
 */
router.get('/validate/:token', async (req, res) => {
    try {
        const tokenString = req.params.token;
        
        // 验证Token格式
        if (!isValidTokenString(tokenString)) {
            return res.status(400).json({ error: '无效的订阅Token格式' });
        }
        
        // 获取并验证Token
        const token = await getAndValidateToken(tokenString);
        
        if (!token) {
            return res.json({ 
                valid: false, 
                error: '订阅Token不存在、已过期或已禁用' 
            });
        }
        
        // 返回Token基本信息（不包含敏感数据）
        res.json({
            valid: true,
            name: sanitizeInput(token.name),
            configTypes: token.configTypes,
            expiresAt: token.expiresAt
        });
    } catch (err) {
        console.error('验证订阅Token失败:', err);
        res.status(500).json({ 
            valid: false, 
            error: '验证订阅Token失败: ' + sanitizeInput(err.message) 
        });
    }
});

module.exports = router; 