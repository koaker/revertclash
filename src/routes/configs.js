const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { ConfigManager, CONFIGS_DIR } = require('../configManager');
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE, processConfigs, CONFIG_CACHE_SETTINGS } = require('../config');
const ConfigCacheService = require('../services/configCacheService');

const router = express.Router();
const configManager = new ConfigManager(CONFIGS_DIR);

// 获取所有配置文件
router.get('/', async (req, res) => {
    try {
        const configs = await configManager.listConfigs();
        res.json(configs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取指定配置文件
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const config = await configManager.readConfig(name);
        res.json(config);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: '配置文件不存在' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// 添加配置文件
router.post('/', async (req, res) => {
    try {
        const { name, content } = req.body;
        if (!name || !content) {
            return res.status(400).json({ error: '名称和内容都是必需的' });
        }
        configManager.validateFileName(name);
        const fileName = await configManager.saveConfig(name, content);
        res.status(201).json({ name: fileName });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 更新配置文件
router.put('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { content, newName } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: '内容是必需的' });
        }
        
        // 处理重命名操作
        if (newName && newName !== name) {
            // 验证新文件名
            try {
                configManager.validateFileName(newName);
            } catch (validationErr) {
                return res.status(400).json({ error: `新文件名无效: ${validationErr.message}` });
            }
            
            // 检查新文件名是否已存在
            const oldPath = path.join(CONFIGS_DIR, name);
            const newPath = path.join(CONFIGS_DIR, newName);
            
            try {
                await fs.access(newPath);
                // 如果能访问，说明文件已存在
                return res.status(400).json({ error: `配置文件 ${newName} 已存在` });
            } catch (accessErr) {
                // 文件不存在，可以继续
            }
            
            // 先保存到新文件
            await configManager.saveConfig(newName, content);
            
            // 删除旧文件
            try {
                await configManager.deleteConfig(name);
            } catch (deleteErr) {
                console.error(`删除旧配置文件失败: ${deleteErr.message}`);
                // 即使删除旧文件失败，也继续返回成功，因为新文件已创建成功
            }
            
            return res.json({ name: newName, renamed: true });
        } else {
            // 没有重命名，只更新内容
            await configManager.saveConfig(name, content);
            return res.json({ name });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 删除配置文件
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await configManager.deleteConfig(name);
        res.status(204).send();
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: '配置文件不存在' });
        } else {
            res.status(400).json({ error: err.message });
        }
    }
});

// 更新配置
router.post('/update', async (req, res) => {
    try {
        console.log('=== 开始配置更新流程 ===');
        await processConfigs();
        console.log('=== 配置更新流程完成 ===');
        res.json({ status: 'success', message: '配置已更新，包含所有URL订阅和独立缓存' });
    } catch (err) {
        console.error('更新配置失败:', err);
        res.status(500).json({ error: err.message || '更新配置失败' });
    }
});

// 获取合并后的配置文件
router.get('/output/merged', async (req, res) => {
    try {
        const config = await fs.readFile(OUTPUT_FILE, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(config);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({
                error: '配置文件尚未生成'
            });
        } else {
            console.error('读取配置文件失败:', err);
            res.status(500).json({
                error: '服务器内部错误'
            });
        }
    }
});

// 获取处理后的配置文件
router.get('/output/processed', async (req, res) => {
    try {
        const config = await fs.readFile(PROCESSED_OUTPUT_FILE, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(config);
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).json({
                error: '配置文件尚未生成'
            });
        } else {
            console.error('读取配置文件失败:', err);
            res.status(500).json({
                error: '服务器内部错误'
            });
        }
    }
});

// ========== 配置缓存管理API ==========

// 获取缓存配置设置
router.get('/cache/settings', async (req, res) => {
    try {
        res.json({
            status: 'success',
            data: CONFIG_CACHE_SETTINGS
        });
    } catch (err) {
        console.error('获取缓存配置设置失败:', err);
        res.status(500).json({ error: '获取缓存配置设置失败: ' + err.message });
    }
});

// 获取缓存统计信息
router.get('/cache/stats', async (req, res) => {
    try {
        const stats = await ConfigCacheService.getCacheStats();
        res.json({
            status: 'success',
            data: stats
        });
    } catch (err) {
        console.error('获取缓存统计失败:', err);
        res.status(500).json({ error: '获取缓存统计失败: ' + err.message });
    }
});

// 获取所有缓存配置列表
router.get('/cache/list', async (req, res) => {
    try {
        const includeExpired = req.query.include_expired === 'true';
        const configs = await ConfigCacheService.getAllConfigs(includeExpired);
        res.json({
            status: 'success',
            data: configs
        });
    } catch (err) {
        console.error('获取缓存配置列表失败:', err);
        res.status(500).json({ error: '获取缓存配置列表失败: ' + err.message });
    }
});

// 获取指定订阅的缓存配置
router.get('/cache/:subscriptionName', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        const includeExpired = req.query.include_expired === 'true';
        
        const config = await ConfigCacheService.getConfig(subscriptionName, includeExpired);
        if (config) {
            res.json({
                status: 'success',
                data: config
            });
        } else {
            res.status(404).json({
                status: 'error',
                error: '缓存配置不存在或已过期'
            });
        }
    } catch (err) {
        console.error(`获取缓存配置失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ error: '获取缓存配置失败: ' + err.message });
    }
});

// 删除指定订阅的缓存
router.delete('/cache/:subscriptionName', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        const deleted = await ConfigCacheService.deleteConfig(subscriptionName);
        
        if (deleted) {
            res.json({
                status: 'success',
                message: `已删除订阅 ${subscriptionName} 的缓存`
            });
        } else {
            res.status(404).json({
                status: 'error',
                error: '缓存配置不存在'
            });
        }
    } catch (err) {
        console.error(`删除缓存配置失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ error: '删除缓存配置失败: ' + err.message });
    }
});

// 清理过期的缓存
router.post('/cache/cleanup', async (req, res) => {
    try {
        const { days_old } = req.body;
        const daysOld = days_old && !isNaN(days_old) ? parseInt(days_old) : 7;
        
        const cleanedCount = await ConfigCacheService.cleanupExpiredConfigs(daysOld);
        
        res.json({
            status: 'success',
            message: `已清理 ${cleanedCount} 个过期的配置缓存`,
            cleaned_count: cleanedCount
        });
    } catch (err) {
        console.error('清理过期缓存失败:', err);
        res.status(500).json({ error: '清理过期缓存失败: ' + err.message });
    }
});

// 强制刷新指定订阅的缓存（重新获取并更新）
router.post('/cache/:subscriptionName/refresh', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        
        // 这里我们触发单个订阅的更新
        // 注意：这需要重构processConfigs函数以支持单个订阅的处理
        // 暂时返回提示信息，建议用户使用全量更新
        res.json({
            status: 'info',
            message: `订阅 ${subscriptionName} 的缓存刷新已请求，请使用 POST /configs/update 进行全量更新`
        });
    } catch (err) {
        console.error(`刷新缓存失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ error: '刷新缓存失败: ' + err.message });
    }
});

// 修复API：修复缓存的is_cached标记
router.post('/cache/repair', async (req, res) => {
    try {
        const db = require('../db');
        
        // 修复所有有内容但is_cached标记不正确的记录
        const result = await db.run(`
            UPDATE subscription_configs 
            SET is_cached = 1 
            WHERE config_content != '' AND (is_cached IS NULL OR is_cached = 0)
        `);
        
        console.log(`修复了 ${result.changes} 个缓存记录的is_cached标记`);
        
        res.json({
            status: 'success',
            message: `已修复 ${result.changes} 个缓存记录的标记`,
            repaired_count: result.changes
        });
    } catch (err) {
        console.error('修复缓存标记失败:', err);
        res.status(500).json({ error: '修复缓存标记失败: ' + err.message });
    }
});

// 调试API：获取订阅的完整状态信息
router.get('/debug/:subscriptionName', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        const debugInfo = {
            subscriptionName,
            timestamp: new Date().toISOString(),
            urlList: null,
            cache: null,
            error: null
        };
        
        // 检查是否在URL列表中
        try {
            const { URLManager, CONFIG_FILE } = require('../urlManager');
            const urlManager = new URLManager(CONFIG_FILE);
            const urls = await urlManager.readUrls();
            const urlEntry = urls.find(u => u.name === subscriptionName);
            debugInfo.urlList = urlEntry ? {
                found: true,
                url: urlEntry.url,
                name: urlEntry.name
            } : {
                found: false,
                message: '订阅名不在URL列表中'
            };
        } catch (urlErr) {
            debugInfo.urlList = { error: urlErr.message };
        }
        
        // 检查缓存状态
        try {
            const cachedConfig = await ConfigCacheService.getConfig(subscriptionName, true);
            if (cachedConfig) {
                debugInfo.cache = {
                    found: true,
                    hasContent: !!cachedConfig.configContent,
                    contentLength: cachedConfig.configContent ? cachedConfig.configContent.length : 0,
                    lastUpdated: cachedConfig.lastUpdated,
                    lastFetchSuccess: cachedConfig.lastFetchSuccess,
                    lastFetchAttempt: cachedConfig.lastFetchAttempt,
                    isExpired: cachedConfig.isExpired,
                    fetchSuccessCount: cachedConfig.fetchSuccessCount,
                    fetchFailureCount: cachedConfig.fetchFailureCount,
                    contentPreview: cachedConfig.configContent ? cachedConfig.configContent.substring(0, 200) + '...' : null
                };
                
                // 尝试解析内容
                if (cachedConfig.configContent) {
                    try {
                        const parserManager = require('../subscription/parserManager');
                        const parsedProxies = await parserManager.parse(cachedConfig.configContent);
                        debugInfo.cache.parseResult = {
                            success: true,
                            proxyCount: parsedProxies ? parsedProxies.length : 0,
                            sampleProxy: parsedProxies && parsedProxies[0] ? parsedProxies[0].name : null
                        };
                    } catch (parseErr) {
                        debugInfo.cache.parseResult = {
                            success: false,
                            error: parseErr.message
                        };
                    }
                }
            } else {
                debugInfo.cache = {
                    found: false,
                    message: '缓存不存在'
                };
            }
        } catch (cacheErr) {
            debugInfo.cache = { error: cacheErr.message };
        }
        
        res.json({
            status: 'success',
            data: debugInfo
        });
    } catch (err) {
        console.error(`调试信息获取失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ error: '调试信息获取失败: ' + err.message });
    }
});

// 获取缓存配置的原始内容（用于调试）
router.get('/cache/:subscriptionName/content', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        const includeExpired = req.query.include_expired === 'true';
        
        const config = await ConfigCacheService.getConfig(subscriptionName, includeExpired);
        if (config && config.configContent) {
            res.setHeader('Content-Type', 'text/yaml');
            res.setHeader('Content-Disposition', `attachment; filename="${subscriptionName}-cached.yaml"`);
            res.send(config.configContent);
        } else {
            res.status(404).json({
                status: 'error',
                error: '缓存配置不存在或已过期'
            });
        }
    } catch (err) {
        console.error(`获取缓存配置内容失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ error: '获取缓存配置内容失败: ' + err.message });
    }
});

// 手动上传指定订阅的缓存配置
router.post('/cache/:subscriptionName/upload', async (req, res) => {
    try {
        const { subscriptionName } = req.params;
        const { content, expire_hours } = req.body;
        
        // 验证输入参数
        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                status: 'error',
                error: '配置内容不能为空且必须是字符串格式'
            });
        }
        
        if (content.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                error: '配置内容不能为空白'
            });
        }
        
        // 验证订阅名称格式
        if (!subscriptionName || subscriptionName.trim().length === 0) {
            return res.status(400).json({
                status: 'error',
                error: '订阅名称不能为空'
            });
        }
        
                 // 处理过期时间参数
         let expireHours = CONFIG_CACHE_SETTINGS.DEFAULT_EXPIRE_HOURS; // 使用配置中的默认值
         if (expire_hours !== undefined) {
             const parsedHours = parseInt(expire_hours);
                           if (isNaN(parsedHours) || parsedHours < CONFIG_CACHE_SETTINGS.MIN_EXPIRE_HOURS || parsedHours > CONFIG_CACHE_SETTINGS.MAX_EXPIRE_HOURS) {
                 return res.status(400).json({
                     status: 'error',
                     error: `过期时间必须是${CONFIG_CACHE_SETTINGS.MIN_EXPIRE_HOURS}-${CONFIG_CACHE_SETTINGS.MAX_EXPIRE_HOURS}小时之间的整数`
                 });
            }
            expireHours = parsedHours;
        }
        
        // 验证配置内容格式（基本检查）
        const parserManager = require('../subscription/parserManager');
        try {
            const parsedProxies = await parserManager.parse(content);
            if (!parsedProxies || parsedProxies.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    error: '配置内容格式无效或不包含有效的代理节点'
                });
            }
            console.log(`手动上传的配置包含 ${parsedProxies.length} 个代理节点`);
        } catch (parseErr) {
            return res.status(400).json({
                status: 'error',
                error: '配置内容解析失败: ' + parseErr.message
            });
        }
        
        // 保存到缓存
        const result = await ConfigCacheService.saveConfig(subscriptionName, content, expireHours);
        
        // 记录操作日志
        console.log(`用户手动上传配置缓存: ${subscriptionName}, 过期时间: ${expireHours}小时`);
        
        res.json({
            status: 'success',
            message: `订阅 ${subscriptionName} 的缓存配置已手动上传`,
            data: {
                subscriptionName,
                expireHours,
                contentLength: content.length,
                contentChanged: result.contentChanged || result.created || false,
                operation: result.created ? 'created' : 'updated'
            }
        });
        
    } catch (err) {
        console.error(`手动上传缓存配置失败 (${req.params.subscriptionName}):`, err);
        res.status(500).json({ 
            status: 'error',
            error: '手动上传缓存配置失败: ' + err.message 
        });
    }
});

// 批量上传多个订阅的缓存配置
router.post('/cache/batch-upload', async (req, res) => {
    try {
        const { configs, expire_hours } = req.body;
        
        // 验证输入参数
        if (!configs || !Array.isArray(configs) || configs.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'configs必须是非空数组'
            });
        }
        
        if (configs.length > 50) {
            return res.status(400).json({
                status: 'error',
                error: '批量上传一次最多支持50个订阅'
            });
        }
        
                 // 处理过期时间参数
         let expireHours = CONFIG_CACHE_SETTINGS.DEFAULT_EXPIRE_HOURS; // 使用配置中的默认值
         if (expire_hours !== undefined) {
             const parsedHours = parseInt(expire_hours);
             if (isNaN(parsedHours) || parsedHours < CONFIG_CACHE_SETTINGS.MIN_EXPIRE_HOURS || parsedHours > CONFIG_CACHE_SETTINGS.MAX_EXPIRE_HOURS) {
                 return res.status(400).json({
                     status: 'error',
                     error: `过期时间必须是${CONFIG_CACHE_SETTINGS.MIN_EXPIRE_HOURS}-${CONFIG_CACHE_SETTINGS.MAX_EXPIRE_HOURS}小时之间的整数`
                 });
            }
            expireHours = parsedHours;
        }
        
        const results = [];
        const parserManager = require('../subscription/parserManager');
        
        // 逐个处理配置
        for (const configItem of configs) {
            const { subscription_name, content } = configItem;
            
            try {
                // 验证单个配置项
                if (!subscription_name || !content) {
                    results.push({
                        subscriptionName: subscription_name || 'unknown',
                        status: 'error',
                        error: '订阅名称和内容不能为空'
                    });
                    continue;
                }
                
                // 验证配置内容格式
                const parsedProxies = await parserManager.parse(content);
                if (!parsedProxies || parsedProxies.length === 0) {
                    results.push({
                        subscriptionName: subscription_name,
                        status: 'error',
                        error: '配置内容格式无效或不包含有效的代理节点'
                    });
                    continue;
                }
                
                // 保存到缓存
                const result = await ConfigCacheService.saveConfig(subscription_name, content, expireHours);
                
                results.push({
                    subscriptionName: subscription_name,
                    status: 'success',
                    proxyCount: parsedProxies.length,
                    contentLength: content.length,
                    operation: result.created ? 'created' : 'updated'
                });
                
                console.log(`批量上传: ${subscription_name} - ${parsedProxies.length} 个节点`);
                
            } catch (itemErr) {
                results.push({
                    subscriptionName: subscription_name || 'unknown',
                    status: 'error',
                    error: itemErr.message
                });
                console.error(`批量上传失败 (${subscription_name}):`, itemErr);
            }
        }
        
        // 统计结果
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        res.json({
            status: 'completed',
            message: `批量上传完成: ${successCount} 成功, ${errorCount} 失败`,
            data: {
                totalCount: configs.length,
                successCount,
                errorCount,
                expireHours,
                results
            }
        });
        
    } catch (err) {
        console.error('批量上传缓存配置失败:', err);
        res.status(500).json({ 
            status: 'error',
            error: '批量上传缓存配置失败: ' + err.message 
        });
    }
});

module.exports = router;
