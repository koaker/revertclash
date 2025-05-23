const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { ConfigManager, CONFIGS_DIR } = require('../configManager');
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE, processConfigs } = require('../config');

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
        await processConfigs();
        res.json({ status: 'success', message: '配置已更新' });
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

module.exports = router;
