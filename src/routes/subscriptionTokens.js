const express = require('express');
const router = express.Router();
const subscriptionTokenService = require('../services/subscriptionTokenService');

/**
 * 获取用户的所有订阅Token
 * GET /api/subscription-tokens
 */
router.get('/', async (req, res) => {
    try {
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
        res.status(500).json({ error: '获取订阅Token失败: ' + err.message });
    }
});

/**
 * 创建新的订阅Token
 * POST /api/subscription-tokens
 * 请求体: { name, configTypes, expiresAt? }
 */
router.post('/', async (req, res) => {
    try {
        const { name, configTypes, expiresAt } = req.body;
        const userId = req.session.user.id;
        
        // 验证必填字段
        if (!name || !configTypes || !Array.isArray(configTypes) || configTypes.length === 0) {
            return res.status(400).json({ error: '名称和配置类型是必需的' });
        }
        
        // 验证配置类型是否有效
        const validConfigTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
        const invalidTypes = configTypes.filter(type => !validConfigTypes.includes(type));
        if (invalidTypes.length > 0) {
            return res.status(400).json({ 
                error: `无效的配置类型: ${invalidTypes.join(', ')}`,
                validTypes: validConfigTypes
            });
        }
        
        // 创建Token
        const token = await subscriptionTokenService.createToken(userId, name, configTypes, expiresAt);
        
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
        res.status(500).json({ error: '创建订阅Token失败: ' + err.message });
    }
});

/**
 * 更新订阅Token
 * PUT /api/subscription-tokens/:id
 * 请求体: { name?, configTypes?, expiresAt?, isActive? }
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        const updates = req.body;
        
        // 验证更新字段
        if (updates.configTypes) {
            if (!Array.isArray(updates.configTypes) || updates.configTypes.length === 0) {
                return res.status(400).json({ error: '配置类型必须是非空数组' });
            }
            
            // 验证配置类型是否有效
            const validConfigTypes = ['config', 'processed-config', 'selected-config', 'merged-config'];
            const invalidTypes = updates.configTypes.filter(type => !validConfigTypes.includes(type));
            if (invalidTypes.length > 0) {
                return res.status(400).json({ 
                    error: `无效的配置类型: ${invalidTypes.join(', ')}`,
                    validTypes: validConfigTypes
                });
            }
        }
        
        // 更新Token
        const success = await subscriptionTokenService.updateToken(parseInt(id), userId, updates);
        
        if (!success) {
            return res.status(404).json({ error: '未找到Token或无权限更新' });
        }
        
        // 获取更新后的Token
        const tokens = await subscriptionTokenService.getTokensByUserId(userId);
        const updatedToken = tokens.find(t => t.id === parseInt(id));
        
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
        res.status(500).json({ error: '更新订阅Token失败: ' + err.message });
    }
});

/**
 * 删除订阅Token
 * DELETE /api/subscription-tokens/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        const success = await subscriptionTokenService.deleteToken(parseInt(id), userId);
        
        if (!success) {
            return res.status(404).json({ error: '未找到Token或无权限删除' });
        }
        
        res.status(204).send();
    } catch (err) {
        console.error('删除订阅Token失败:', err);
        res.status(500).json({ error: '删除订阅Token失败: ' + err.message });
    }
});

/**
 * 重新生成Token字符串
 * POST /api/subscription-tokens/:id/regenerate
 */
router.post('/:id/regenerate', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        const regeneratedToken = await subscriptionTokenService.regenerateToken(parseInt(id), userId);
        
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
        res.status(500).json({ error: '重新生成Token失败: ' + err.message });
    }
});

module.exports = router; 