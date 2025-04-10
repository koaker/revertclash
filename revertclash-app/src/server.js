const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { OUTPUT_FILE } = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础状态检查
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 获取合并后的配置文件
app.get('/config', async (req, res) => {
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

function startServer() {
    app.listen(PORT, () => {
        console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
        console.log(`配置文件地址: http://localhost:${PORT}/config`);
    });
}

module.exports = {
    startServer
};