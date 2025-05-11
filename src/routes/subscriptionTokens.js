const express = require('express');
const router = express.Router();
const subscriptionTokenService = require('../services/subscriptionTokenService');

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
 * 验证Token名称
 * @param {string} name - Token名称
 * @returns {boolean} 是否有效
 */
function isValidTokenName(name) {
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
        return false;
    }
    // 只允许字母、数字、中文和一些常见标点
    return /^[\w\u4e00-\u9fa5\s\-_.]+$/.test(name);
}

/**
 * 验证配置类型列表
 * @param {string[]} configTypes - 配置类型列表
 * @returns {boolean} 是否有效
 */
function hasValidConfigTypes(configTypes) {
    const validTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
    
    if (!Array.isArray(configTypes) || configTypes.length === 0) {
        return false;
    }
    
    return configTypes.every(type => validTypes.includes(type));
}

/**
 * 获取用户的所有订阅Token
 * GET /api/subscription-tokens
 */
router.get('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: '未登录或会话已过期' });
        }
        
        const userId = req.session.user.id;
        const tokens = await subscriptionTokenService.getTokensByUserId(userId);
        
        // 为每个Token添加完整的订阅链接
        const tokensWithUrls = tokens.map(token => {
            const baseUrl = `${req.protocol}://${req.get('host')}/subscribe/${token.token}`;
            return {
                ...token,
                subscribeUrls: token.configTypes.map(type => ({
                    type,
                    url: `${baseUrl}/${type}`
                }))
            };
        });
        
        res.json(tokensWithUrls);
    } catch (err) {
        console.error('获取订阅Token失败:', err);
        res.status(500).json({ error: '获取订阅Token失败: ' + sanitizeInput(err.message) });
    }
});

/**
 * 创建新的订阅Token
 * POST /api/subscription-tokens
 * 请求体: { name, configTypes, expiresAt? }
 */
router.post('/', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: '未登录或会话已过期' });
        }
        
        const { name, configTypes, expiresAt } = req.body;
        const userId = req.session.user.id;
        
        // 验证Token名称
        if (!isValidTokenName(name)) {
            return res.status(400).json({ 
                error: '无效的Token名称，只允许字母、数字、中文和常见标点，长度1-50个字符' 
            });
        }
        
        // 验证配置类型是否有效
        if (!hasValidConfigTypes(configTypes)) {
            const validConfigTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
            return res.status(400).json({ 
                error: `无效的配置类型，必须是非空数组且包含有效的类型`,
                validTypes: validConfigTypes
            });
        }
        
        // 验证过期时间
        let parsedExpiresAt = null;
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            if (isNaN(expiryDate.getTime())) {
                return res.status(400).json({ error: '无效的过期时间格式' });
            }
            parsedExpiresAt = expiryDate;
        }
        
        // 创建Token
        const token = await subscriptionTokenService.createToken(
            userId, 
            sanitizeInput(name), 
            configTypes, 
            parsedExpiresAt
        );
        
        // 为Token添加完整订阅链接
        const baseUrl = `${req.protocol}://${req.get('host')}/subscribe/${token.token}`;
        const subscribeUrls = token.configTypes.map(type => ({
            type,
            url: `${baseUrl}/${type}`
        }));
        
        res.status(201).json({
            ...token,
            subscribeUrls
        });
    } catch (err) {
        console.error('创建订阅Token失败:', err);
        res.status(500).json({ error: '创建订阅Token失败: ' + sanitizeInput(err.message) });
    }
});

/**
 * 更新订阅Token
 * PUT /api/subscription-tokens/:id
 * 请求体: { name?, configTypes?, expiresAt?, isActive? }
 */
router.put('/:id', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: '未登录或会话已过期' });
        }
        
        const idParam = req.params.id;
        // 验证ID是否为有效的整数
        const id = parseInt(idParam, 10);
        if (isNaN(id) || id <= 0 || id.toString() !== idParam) {
            return res.status(400).json({ error: '无效的Token ID' });
        }
        
        const userId = req.session.user.id;
        const updates = req.body;
        
        // 验证更新字段
        if (updates.name && !isValidTokenName(updates.name)) {
            return res.status(400).json({ 
                error: '无效的Token名称，只允许字母、数字、中文和常见标点，长度1-50个字符' 
            });
        }
        
        if (updates.configTypes && !hasValidConfigTypes(updates.configTypes)) {
            const validConfigTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
            return res.status(400).json({ 
                error: `无效的配置类型，必须是非空数组且包含有效的类型`,
                validTypes: validConfigTypes
            });
        }
        
        // 验证过期时间
        if (updates.expiresAt) {
            const expiryDate = new Date(updates.expiresAt);
            if (isNaN(expiryDate.getTime())) {
                return res.status(400).json({ error: '无效的过期时间格式' });
            }
            updates.expiresAt = expiryDate;
        }
        
        // 验证isActive
        if (updates.isActive !== undefined && typeof updates.isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive必须是布尔值' });
        }
        
        // 确保更新数据中的name是经过清理的
        if (updates.name) {
            updates.name = sanitizeInput(updates.name);
        }
        
        // 更新Token
        const success = await subscriptionTokenService.updateToken(id, userId, updates);
        
        if (!success) {
            return res.status(404).json({ error: '未找到Token或无权限更新' });
        }
        
        // 获取更新后的Token
        const tokens = await subscriptionTokenService.getTokensByUserId(userId);
        const updatedToken = tokens.find(t => t.id === id);
        
        // 为Token添加完整订阅链接
        const baseUrl = `${req.protocol}://${req.get('host')}/subscribe/${updatedToken.token}`;
        const subscribeUrls = updatedToken.configTypes.map(type => ({
            type,
            url: `${baseUrl}/${type}`
        }));
        
        res.json({
            ...updatedToken,
            subscribeUrls
        });
    } catch (err) {
        console.error('更新订阅Token失败:', err);
        res.status(500).json({ error: '更新订阅Token失败: ' + sanitizeInput(err.message) });
    }
});

/**
 * 删除订阅Token
 * DELETE /api/subscription-tokens/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: '未登录或会话已过期' });
        }
        
        const idParam = req.params.id;
        // 验证ID是否为有效的整数
        const id = parseInt(idParam, 10);
        if (isNaN(id) || id <= 0 || id.toString() !== idParam) {
            return res.status(400).json({ error: '无效的Token ID' });
        }
        
        const userId = req.session.user.id;
        
        const success = await subscriptionTokenService.deleteToken(id, userId);
        
        if (!success) {
            return res.status(404).json({ error: '未找到Token或无权限删除' });
        }
        
        res.status(204).send();
    } catch (err) {
        console.error('删除订阅Token失败:', err);
        res.status(500).json({ error: '删除订阅Token失败: ' + sanitizeInput(err.message) });
    }
});

/**
 * 重新生成Token字符串
 * POST /api/subscription-tokens/:id/regenerate
 */
router.post('/:id/regenerate', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: '未登录或会话已过期' });
        }
        
        const idParam = req.params.id;
        // 验证ID是否为有效的整数
        const id = parseInt(idParam, 10);
        if (isNaN(id) || id <= 0 || id.toString() !== idParam) {
            return res.status(400).json({ error: '无效的Token ID' });
        }
        
        const userId = req.session.user.id;
        
        const regeneratedToken = await subscriptionTokenService.regenerateToken(id, userId);
        
        if (!regeneratedToken) {
            return res.status(404).json({ error: '未找到Token或无权限重新生成' });
        }
        
        // 为Token添加完整订阅链接
        const baseUrl = `${req.protocol}://${req.get('host')}/subscribe/${regeneratedToken.token}`;
        const subscribeUrls = regeneratedToken.configTypes.map(type => ({
            type,
            url: `${baseUrl}/${type}`
        }));
        
        res.json({
            ...regeneratedToken,
            subscribeUrls
        });
    } catch (err) {
        console.error('重新生成Token失败:', err);
        res.status(500).json({ error: '重新生成Token失败: ' + sanitizeInput(err.message) });
    }
});

module.exports = router; 