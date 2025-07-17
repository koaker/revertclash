const express = require('express');
const router = express.Router();
const UserContentManager = require('../managers/UserContentManager');
const { sessionAuthMiddleware } = require('../middleware/authMiddleware');

// 所有此路由下的端点都需要用户登录
router.use(sessionAuthMiddleware);

router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        const configs = await UserContentManager.getUserCustomConfigs(userId);

        res.json(configs);
    } catch (err) {
        console.error('获取用户自定义配置失败:', err);
        res.status(500).json({ error: '获取用户自定义配置失败: ' + err.message });
    }

});

router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const configId = req.params.id;

        const config = await UserContentManager.getConfigById(userId, configId);
        if (!config) {
            return res.status(404).json({ error: '未找到指定的配置' });
        }
        res.json(config);
    } catch (err) {
        console.error('获取用户自定义配置失败:', err);
        res.status(500).json({ error: '获取用户自定义配置失败: ' + err.message });
    }

});

router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, content } = req.body;

        if (!name || !content) {
            return res.status(400).json({ error: '名称和内容不能为空' });
        }

        const newConfig = await UserContentManager.addUserCustomConfig(userId, name, content);

        res.status(201).json(newConfig);
    } catch (err) {
        console.error('创建用户自定义配置失败:', err);
        res.status(500).json({ error: '创建用户自定义配置失败: ' + err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const configId = req.params.id;
        const { name, content } = req.body;

        if (isNaN(configId)) {
            return res.status(400).json({ error: '无效的配置ID' });
        }
        if (!name || !content) {
            return res.status(400).json({ error: '名称和内容不能为空' });
        }
        const existingConfig = await UserContentManager.getConfigById(userId, configId);
        if (!existingConfig) {
            return res.status(404).json({ error: '未找到指定的配置' });
        }
        const updatedConfig = await UserContentManager.updateUserCustomConfig(userId, configId, name, content);

        res.json(updatedConfig);
    } catch (err) {
        console.error('更新用户自定义配置失败:', err);
        res.status(500).json({ error: '更新用户自定义配置失败: ' + err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const configId = req.params.id;

        if (isNaN(configId)) {
            return res.status(400).json({ error: '无效的配置ID' });
        }
        if (!configId) {
            return res.status(400).json({ error: '配置ID不能为空' });
        }
        const existingConfig = await UserContentManager.getConfigById(userId, configId);
        if (!existingConfig) {
            return res.status(404).json({ error: '未找到指定的配置' });
        }
        await UserContentManager.deleteUserCustomConfig(userId, configId);


        res.status(204).send();
    } catch (err) {
        console.error('删除用户自定义配置失败:', err);
        res.status(500).json({ error: '删除用户自定义配置失败: ' + err.message });
    }
});

module.exports = router;