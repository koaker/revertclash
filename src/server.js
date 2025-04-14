const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { OUTPUT_FILE } = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'admin'; // 默认密码
const authorizedIPs = new Set();

// IP验证中间件
const checkIPAuth = (req, res, next) => {
    const clientIP = req.ip;
    if (authorizedIPs.has(clientIP)) {
        next();
    } else {
        res.status(403).json({
            error: '未授权的IP地址'
        });
    }
};

// 基础状态检查
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 获取合并后的配置文件
// IP认证接口
app.post('/auth', express.json(), (req, res) => {
    const { password } = req.body;
    const clientIP = req.ip;

    if (password === AUTH_PASSWORD) {
        authorizedIPs.add(clientIP);
        res.json({
            status: 'success',
            message: 'IP认证成功'
        });
    } else {
        res.status(401).json({
            error: '密码错误'
        });
    }
});

app.get('/config', checkIPAuth, async (req, res) => {
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

// 获取已授权的IP列表
app.get('/auth/list', (req, res) => {
    res.json({
        authorized_ips: Array.from(authorizedIPs)
    });
});

// 移除IP授权
app.delete('/auth', express.json(), (req, res) => {
    const { ip } = req.body;
    if (authorizedIPs.has(ip)) {
        authorizedIPs.delete(ip);
        res.json({
            status: 'success',
            message: `已移除IP: ${ip}`
        });
    } else {
        res.status(404).json({
            error: '未找到该IP'
        });
    }
});

function startServer() {
    app.listen(PORT, () => {
        console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
        console.log(`配置文件地址: http://localhost:${PORT}/config`);
        console.log(`默认验证密码: ${AUTH_PASSWORD}`);
    });
}

module.exports = {
    startServer
};