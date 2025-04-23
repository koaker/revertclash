const express = require('express');
const { URLManager, CONFIG_FILE } = require('../urlManager');

const router = express.Router();
const urlManager = new URLManager(CONFIG_FILE);

// 获取所有URL
router.get('/', async (req, res) => {
    try {
        const urls = await urlManager.readUrls();
        res.json(urls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 添加URL
router.post('/', async (req, res) => {
    try {
        const { name, url } = req.body;
        if (!name || !url) {
            return res.status(400).json({ error: '名称和URL都是必需的' });
        }
        const result = await urlManager.addUrl(name, url);
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
        const result = await urlManager.updateUrl(oldName, newName, url);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 删除URL
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        await urlManager.deleteUrl(name);
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
