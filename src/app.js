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
const subscribeRoutes = require('./routes/subscribe');
const newConfigRoutes = require('./routes/newconfig');
const { processConfigs } = require('./config');
const fs = require('fs').promises;
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE } = require('./config');
const rateLimiter = require('./middleware/rateLimiter');

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
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天，原为30天
    }
}));

// 添加客户端IP获取中间件
app.use((req, res, next) => {
    req.clientIp = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   req.connection.socket.remoteAddress || 
                   '127.0.0.1';
    
    // 如果是IPv4-mapped IPv6地址，转换为IPv4格式
    if (req.clientIp.includes('::ffff:')) {
        req.clientIp = req.clientIp.split('::ffff:')[1];
    }
    
    next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '..', 'public')));

// 协议转换器API
app.use('/api/converter', converterApi);

// 订阅路由 - 无需登录，放在认证中间件前面，但需要频率限制
app.use('/subscribe', rateLimiter.createLimiter({
    windowMs: 1 * 60 * 1000,  // 1分钟窗口
    maxRequests: 10,          // 每IP每窗口最多10次请求
    message: '请求过于频繁，请稍后再试'
}), subscribeRoutes);

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
app.use('/api/newconfig', newConfigRoutes);
app.use('/api/subscription-tokens', rateLimiter.createLimiter({
    windowMs: 1 * 60 * 1000,  // 1分钟窗口
    maxRequests: 30,          // 每IP每窗口最多30次请求
    message: '请求过于频繁，请稍后再试'
}), subscriptionTokenRoutes);

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

// 为所有API响应添加安全相关的HTTP头
app.use((req, res, next) => {
    // 只为API响应和下载添加安全头
    if (req.path.startsWith('/api/') || req.path.startsWith('/subscribe/')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('Cache-Control', 'no-store, max-age=0');
    }
    next();
});
/*
// 兼容原始路径的配置文件访问 (应用频率限制)
// 合并后的配置文件访问
app.get('/config', rateLimiter.createLimiter({
    windowMs: 1 * 60 * 1000,  // 1分钟窗口
    maxRequests: 5,           // 每IP每窗口最多5次请求
    message: '请求过于频繁，请稍后再试'
}), async (req, res) => {
    try {
        const config = await fs.readFile(OUTPUT_FILE, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('Cache-Control', 'no-store, max-age=0');
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
app.get('/processed-config', rateLimiter.createLimiter({
    windowMs: 1 * 60 * 1000,  // 1分钟窗口
    maxRequests: 5,           // 每IP每窗口最多5次请求
    message: '请求过于频繁，请稍后再试'
}), async (req, res) => {
    try {
        const config = await fs.readFile(PROCESSED_OUTPUT_FILE, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('Cache-Control', 'no-store, max-age=0');
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
*/
module.exports = app;
