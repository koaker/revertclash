const express = require('express');
const path = require('path');
const session = require('express-session');
const ConnectSQLite = require('connect-sqlite3')(session);
const { sessionAuthMiddleware, setupRedirectMiddleware } = require('./middleware/authMiddleware');
const converterApi = require('./converters/api');
const urlRoutes = require('./routes/urls');
const configRoutes = require('./routes/configs');
const pageRoutes = require('./routes/pages');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const nodeRoutes = require('./routes/nodes');
const subscriptionTokenRoutes = require('./routes/subscriptionTokens');
const { processConfigs } = require('./config');
const fs = require('fs').promises;
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE } = require('./config');
const subscriptionTokenService = require('./services/subscriptionTokenService');

// 创建Express应用
const app = express();

// 支持JSON请求体
app.use(express.json());

// 基础状态检查 - 放在最前面，避免被认证中间件阻止
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 设置会话中间件
app.use(session({
    store: new ConnectSQLite({
        db: 'revertclash_sessions.db',
        dir: path.join(__dirname, '..', 'data')
    }),
    secret: process.env.SESSION_SECRET || 'revertclash-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
    }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));

// 协议转换器API
app.use('/api/converter', converterApi);

// 订阅访问API - 无需登录，放在认证中间件前面
app.get('/subscribe/:token/:configType', async (req, res) => {
    try {
        const { token, configType } = req.params;
        
        // 验证Token是否有权限访问指定配置类型
        const isAuthorized = await subscriptionTokenService.isTokenAuthorized(token, configType);
        
        if (!isAuthorized) {
            return res.status(403).json({
                error: '无效的订阅链接或无权访问该配置类型'
            });
        }
        
        // 根据配置类型返回相应的配置文件
        let filePath;
        switch (configType) {
            case 'config':
                filePath = OUTPUT_FILE;
                break;
            case 'processed-config':
                filePath = PROCESSED_OUTPUT_FILE;
                break;
            default:
                return res.status(400).json({
                    error: '不支持的配置类型'
                });
        }
        
        const config = await fs.readFile(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(config);
    } catch (err) {
        console.error('订阅访问失败:', err);
        
        if (err.code === 'ENOENT') {
            res.status(404).json({
                error: '配置文件尚未生成'
            });
        } else {
            res.status(500).json({
                error: '服务器内部错误: ' + err.message
            });
        }
    }
});

// 新增登录、设置页面路由 - 放在认证中间件前面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'setup.html'));
});

// 应用初始设置重定向中间件
app.use(setupRedirectMiddleware);

// 使用基于会话的认证中间件
app.use(sessionAuthMiddleware);

// 注册路由
app.use('/', pageRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/subscription-tokens', subscriptionTokenRoutes);

// 账号管理页面 - 放在认证中间件后面，需要登录才能访问
app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'account.html'));
});

// 订阅管理页面
app.get('/subscription', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'subscription.html'));
});

// 手动更新配置API
app.post('/api/update', async (req, res) => {
    try {
        await processConfigs();
        res.json({
            status: 'success',
            message: '配置已更新'
        });
    } catch (err) {
        console.error('更新配置失败:', err);
        res.status(500).json({
            error: '更新配置失败: ' + err.message
        });
    }
});

// 兼容原始路径的配置文件访问
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
