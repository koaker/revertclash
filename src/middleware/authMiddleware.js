const {hasInitialAdmin} = require('../services/userAuth');

// 会话认证中间件
const sessionAuthMiddleware = (req, res, next) => {
    //console.log(`[会话认证] 路径: ${req.path}, 方法: ${req.method}, 用户: ${req.session && req.session.user ? req.session.user.username : '未登录'}`);
    
    // 跳过认证页面和认证接口
    const skipPaths = [
        '/login', '/login.html', 
        '/setup', '/setup.html', 
        '/auth/login', '/auth/register', 
        '/auth/status', '/auth/setup-status',
        '/status',  // 添加基础状态检查到跳过列表
        '/favicon.ico'  // 跳过网站图标
    ];
    
    // 跳过静态资源文件（生产环境的Vue应用资源）
    if (req.path.startsWith('/assets/') || 
        req.path.endsWith('.js') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.ico') || 
        req.path.endsWith('.png') || 
        req.path.endsWith('.jpg') || 
        req.path.endsWith('.jpeg') || 
        req.path.endsWith('.gif') || 
        req.path.endsWith('.svg') ||
        req.path.endsWith('.woff') ||
        req.path.endsWith('.woff2') ||
        req.path.endsWith('.ttf') ||
        req.path.endsWith('.eot')) {
        return next();
    }
    
    // 检查是否为订阅访问路径
    if (req.path.startsWith('/subscribe/')) {
        console.log(`[会话认证] 订阅访问路径: ${req.path}，跳过认证`);
        return next();
    }
    
    if (skipPaths.includes(req.path) || req.path.startsWith('/auth/')) {
        console.log(`[会话认证] 跳过路径: ${req.path}`);
        return next();
    }

    // 检查用户是否已登录
    if (req.session && req.session.user) {
        // res.locals.user 用于向视图传递数据
        res.locals.user = req.session.user;

        // res.user 用户服务器端的用户
        req.user = req.session.user; // 确保req.user可用
        next();
    } else {
        console.log(`[会话认证] 用户未登录，重定向到登录页面，请求路径: ${req.path}`);
        // 如果是API请求，返回401状态码
        if (req.path.startsWith('/api/') || req.accepts('html') !== 'html') {
            res.status(401).json({
                error: '未登录或会话已过期',
                redirect: '/login'
            });
        } else {
            // 否则重定向到登录页面
            res.redirect('/login');
        }
    }
};

// 管理员权限中间件
const adminAuthMiddleware = (req, res, next) => {
    // 检查用户是否已登录且是管理员
    if (req.session && req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        // 如果是API请求，返回403状态码
        if (req.path.startsWith('/api/') || req.accepts('html') !== 'html') {
            res.status(403).json({
                error: '需要管理员权限'
            });
        } else {
            // 否则重定向到登录页面
            res.redirect('/login?error=需要管理员权限');
        }
    }
};

// 初始设置重定向中间件
const setupRedirectMiddleware = (req, res, next) => {
    
    // 跳过订阅访问路径的重定向
    if (req.path.startsWith('/subscribe/')) {
        //console.log(`[设置重定向] 订阅访问路径: ${req.path}，跳过重定向`);
        return next();
    }
    
    // 如果系统需要初始设置且请求不是设置页面或API
    if (
        !hasInitialAdmin() && 
        !req.path.startsWith('/setup') && 
        !req.path.startsWith('/auth/setup') &&
        !req.path.startsWith('/auth/register') &&
        req.path !== '/auth/setup-status' &&
        req.path !== '/status'  // 添加基础状态检查到跳过列表
    ) {
        console.log(`[设置重定向] 需要初始设置，重定向到/setup, 原路径: ${req.path}`);
        if (req.accepts('html') === 'html') {
            return res.redirect('/setup');
        } else {
            return res.status(503).json({
                error: '系统需要初始设置',
                redirect: '/setup'
            });
        }
    }
    next();
};

module.exports = {
    sessionAuthMiddleware,  // 会话认证中间件
    adminAuthMiddleware,    // 管理员权限中间件
    setupRedirectMiddleware // 初始设置重定向中间件
};
