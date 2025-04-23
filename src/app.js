const express = require('express');
const path = require('path');
const { authMiddleware } = require('./middleware/authMiddleware');
const converterApi = require('./converters/api');
const urlRoutes = require('./routes/urls');
const configRoutes = require('./routes/configs');
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const nodeRoutes = require('./routes/nodes');

// 创建Express应用
const app = express();

// 支持JSON请求体
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));

// 协议转换器API
app.use('/api/converter', converterApi);

// 应用IP认证中间件
app.use(authMiddleware);

// 注册路由
app.use('/', pageRoutes);
app.use('/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/nodes', nodeRoutes);

// 基础状态检查
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 兼容原始路径的配置文件访问
const fs = require('fs').promises;
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE } = require('./config');

// 合并后的配置文件访问
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

// 处理后的配置文件访问
app.get('/processed-config', async (req, res) => {
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

module.exports = app;
