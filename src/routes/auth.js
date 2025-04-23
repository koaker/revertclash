const express = require('express');
const path = require('path');
const { 
    authConfig, 
    checkAuthAttempts, 
    getRemainingAttempts, 
    authorizeIP, 
    deauthorizeIP, 
    getAuthorizedIPs,
    saveAuthConfig
} = require('../auth');

const router = express.Router();

// 认证页面路由
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'auth.html'));
});

// 获取验证尝试状态
router.get('/attempts', (req, res) => {
    const clientIP = req.ip;
    const remaining = getRemainingAttempts(clientIP);
    const today = new Date().toISOString().split('T')[0];
    
    res.json({
        ip: clientIP,
        remainingAttempts: remaining,
        maxAttemptsPerDay: authConfig.maxAttemptsPerDay,
        nextResetTime: `${today}T23:59:59`
    });
});

// 登录验证
router.post('/login', express.json(), (req, res) => {
    const { password } = req.body;
    const clientIP = req.ip;

    // 检查尝试次数
    if (!checkAuthAttempts(clientIP)) {
        const today = new Date().toISOString().split('T')[0];
        res.status(429).json({
            error: '今日验证次数已达上限',
            nextResetTime: `${today}T23:59:59`
        });
        return;
    }

    // 获取剩余尝试次数
    const remainingAttempts = getRemainingAttempts(clientIP);

    if (password === authConfig.password) {
        authorizeIP(clientIP);
        res.json({
            status: 'success',
            message: 'IP认证成功',
            remainingAttempts,
            redirect: '/home'
        });
    } else {
        res.status(401).json({
            error: '密码错误',
            remainingAttempts
        });
    }
});

// 修改密码接口
router.post('/password', express.json(), async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        res.status(400).json({ error: '需要提供旧密码和新密码' });
        return;
    }
    
    if (oldPassword !== authConfig.password) {
        res.status(401).json({ error: '旧密码错误' });
        return;
    }
    
    authConfig.password = newPassword;
    await saveAuthConfig(authConfig);
    
    res.json({
        status: 'success',
        message: '密码修改成功'
    });
});

// 获取已授权的IP列表
router.get('/list', (req, res) => {
    res.json({
        authorized_ips: getAuthorizedIPs()
    });
});

// 移除IP授权
router.delete('/', express.json(), (req, res) => {
    const { ip } = req.body;
    if (deauthorizeIP(ip)) {
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

module.exports = router;
