const express = require('express');
const URLManager = require('../managers/UrlManager.js'); // 假设 URLManager 在上级目录
const { sessionAuthMiddleware } = require('../middleware/authMiddleware'); 
const router = express.Router();

router.use(sessionAuthMiddleware);
// 获取所有URL（包含用户信息）
router.get('/', async (req, res) => {
    try {
        // 1. 读取基础 URL 列表
        const urls = await URLManager.getUrlsByUserId(req.user.id);
        res.json(urls);
    } catch (err) {
        console.error('获取 URL 列表时发生错误:', err);
        res.status(500).json({ error: '获取 URL 列表失败: ' + err.message });
    }
});

// 添加URL
router.post('/', async (req, res) => {
    try {
        const { name, url } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: '名称和URL都是必需的' });
        }
        const result = await URLManager.addUrl(req.user.id, name, url);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 更新URL
router.put('/:name', async (req, res) => {
    try {
        const { name: oldName } = req.params;
        const { name: newName, url } = req.body;
        if (!newName || !url) {
            return res.status(400).json({ error: '新名称和URL都是必需的' });
        }
        const result = await URLManager.updateUrl(req.user.id, oldName, newName, url);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 删除URL
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await URLManager.deleteUrl(req.user.id, name);
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
