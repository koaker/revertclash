const express = require('express');
const fs = require('fs').promises; // 需要 fs 来读取用户信息文件
const path = require('path'); // 需要 path 来构建文件路径
const { URLManager, CONFIG_FILE } = require('../urlManager');

const router = express.Router();
const urlManager = new URLManager(CONFIG_FILE);

// 获取所有URL（包含用户信息）
router.get('/', async (req, res) => {
    try {
        // 1. 读取基础 URL 列表
        const urls = await urlManager.readUrls();
        const userInfoFilePath = path.join(__dirname, '..', '..', 'url-userinfo.json'); // 用户信息文件路径 (注意路径层级)
        let userInfoData = {};

        // 2. 尝试读取用户信息文件
        try {
            const userInfoContent = await fs.readFile(userInfoFilePath, 'utf8');
            userInfoData = JSON.parse(userInfoContent);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('用户信息文件 url-userinfo.json 不存在，将不合并用户信息。');
                // 文件不存在是正常情况，不需要报错
            } else {
                // 其他读取或解析错误需要记录
                console.error('读取或解析用户信息文件失败:', err.message);
                // 即使读取失败，也应返回基础 URL 列表，而不是抛出 500 错误
            }
        }

        // 3. 合并用户信息
        const urlsWithInfo = urls.map(urlItem => {
            const userInfo = userInfoData[urlItem.name]; // 使用名称匹配
            return {
                ...urlItem,
                userInfo: userInfo || null // 如果没有找到匹配的用户信息，则为 null
            };
        });

        // 4. 返回合并后的列表
        res.json(urlsWithInfo);
    } catch (err) {
        // 这个 catch 主要捕获 urlManager.readUrls() 可能发生的错误
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
