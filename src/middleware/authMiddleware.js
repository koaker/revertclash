const { isAuthorized } = require('../auth');

// IP验证中间件
const authMiddleware = (req, res, next) => {
    const clientIP = req.ip;
    
    // 跳过验证页面和验证接口
    const skipPaths = ['/auth', '/auth.html', '/auth/attempts', '/auth/login', '/auth/password', '/auth/list'];
    if (skipPaths.includes(req.path) || req.path.startsWith('/auth/')) {
        return next();
    }

    if (isAuthorized(clientIP)) {
        next();
    } else {
        // 如果是API请求，返回403状态码
        if (req.path.startsWith('/api/') || req.accepts('html') !== 'html') {
            res.status(403).json({
                error: '未授权的IP地址'
            });
        } else {
            // 否则重定向到认证页面
            res.redirect('/auth');
        }
    }
};

module.exports = {
    authMiddleware
};
