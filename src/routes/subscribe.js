const express = require('express');
const router = express.Router();
const subscriptionTokenService = require('../services/subscriptionTokenService');

const UrlManager = require('../managers/UrlManager');
const UserContentManager = require('../managers/UserContentManager');
const ConfigManager = require('../managers/ConfigManager');
const { SourceType } = require('../models/ConfigSource');
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
 * 通过订阅链接获取配置内容
 * GET /subscribe/:token/:type
 */
router.get('/:token/:type', async (req, res) => {
    try {
        const tokenString = req.params.token;
        const configType = req.params.type;
        const clientIp = req.clientIp || req.ip;
        
        // 验证Token格式
        if (!isValidTokenString(tokenString)) {
            return res.status(400).json({ error: '无效的订阅Token格式' });
        }
        
        // 验证配置类型
        if (!isValidConfigType(configType)) {
            return res.status(400).json({ error: '无效的配置类型' });
        }

        // IP访问频率限制检查
        if (!subscriptionTokenService.accessLimiter.checkAccess(clientIp)) {
            console.warn(`[安全警告] IP访问频率超限: ${clientIp}`);
            return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
        }
        
        // 验证Token是否有权限访问该配置类型
        const isAuthorized = await subscriptionTokenService.isTokenAuthorized(tokenString, configType, clientIp);
        
        if (!isAuthorized) {
            return res.status(403).json({ error: '无效的Token或无权访问该配置类型' });
        }
        
        // 获取Token详细信息
        const token = await subscriptionTokenService.getTokenByString(tokenString);
        
        const urlSources = await UrlManager.getUrlsByUserId(token.userId);
        const customConfigSources = await UserContentManager.getUserCustomConfigs(token.userId);

        console.log(`即将开始获取配置`);
        const sources = [];
        urlSources.forEach(s => {
            sources.push({
                name: s.name,
                type: SourceType.URL,
                data: s.url
            });
        })
        customConfigSources.forEach(s => {
            sources.push({
                name: s.name,
                type: SourceType.MANUAL,
                data: s.config
            });
            console.log(`添加自定义配置源: ${s.name}` );
            console.log(`配置内容: ${s.config}`);
        })

        if (sources.length === 0) {
            return res.status(404).json({ error: '未找到任何配置源' });
        }

        const configManager = new ConfigManager();
        const result = await configManager.process(sources);
        if (!result || !result.processedConfig) {
            return res.status(500).json({ error: '配置处理失败' });
        }
        let configContent;
        if (configType === 'config') {
            configContent = result.mergedConfig;
        } else if (configType === 'processed-config') {
            configContent = result.processedConfig;
        }
        if (!configContent) {
            return res.status(500).json({ error: '处理后的配置内容为空' });
        }
        // 添加安全相关的HTTP头
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        
        // 如果是config类型，则设置正确的Content-Type和文件名
        if (configType === 'config' || configType === 'processed-config') {
            res.setHeader('Content-Type', 'application/octet-stream');
            // 使用不带引号的格式并保留配置类型信息
            res.setHeader('Content-Disposition', `attachment; filename=${configType}.yaml`);
            return res.send(configContent);
        }
        
        // 其他类型按JSON返回
        res.setHeader('Content-Type', 'application/json');
        res.send(configContent);
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
        const clientIp = req.clientIp || req.ip;
        
        // 验证Token格式
        if (!isValidTokenString(tokenString)) {
            return res.status(400).json({ error: '无效的订阅Token格式' });
        }
        
        // IP访问频率限制检查
        if (!subscriptionTokenService.accessLimiter.checkAccess(clientIp)) {
            console.warn(`[安全警告] IP访问频率超限: ${clientIp}`);
            return res.status(429).json({ 
                valid: false, 
                error: '请求过于频繁，请稍后再试' 
            });
        }
        
        // 获取Token详细信息
        const token = await subscriptionTokenService.getTokenByString(tokenString);
        
        if (!token) {
            return res.json({ 
                valid: false, 
                error: '订阅Token不存在、已过期或已禁用' 
            });
        }
        
        // 检查Token是否过期
        if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
            return res.json({ 
                valid: false, 
                error: '订阅Token已过期' 
            });
        }
        
        // 检查Token是否激活
        if (!token.isActive) {
            return res.json({ 
                valid: false, 
                error: '订阅Token已被禁用' 
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