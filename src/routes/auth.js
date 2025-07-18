const express = require('express');
const userAuthService = require('../services/userAuth');

const router = express.Router();

// 登录验证API
router.post('/login', express.json(), async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`[登录] 尝试登录用户: ${username}`);
    
    if (!username || !password) {
        console.log(`[登录] 失败: 用户名或密码为空`);
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const result = await userAuthService.authenticateUser(username, password);
    
    if (result.success) {
        // 将用户信息存入会话
        req.session.user = result.user;
        console.log(`[登录] 成功: 用户 ${username} 已登录, isAdmin=${result.user.isAdmin}, isFirstLogin=${result.user.isFirstLogin}`);
        res.json({
            status: 'success',
            user: {
                username: result.user.username,
                isAdmin: result.user.isAdmin,
                isFirstLogin: result.user.isFirstLogin
            },
            redirect: result.user.isFirstLogin ? '/account' : '/home'
        });
    } else {
        console.log(`[登录] 失败: ${result.message}`);
        res.status(401).json({
            error: result.message
        });
    }
});

// 退出登录API
router.post('/logout', (req, res) => {
    const username = req.session && req.session.user ? req.session.user.username : '未知';
    console.log(`[登出] 用户 ${username} 正在登出`);
    
    req.session.destroy(err => {
        if (err) {
            console.log(`[登出] 失败: ${err.message}`);
            return res.status(500).json({ error: '退出登录失败' });
        }
        console.log(`[登出] 成功: 用户 ${username} 已登出`);
        res.json({
            status: 'success',
            message: '已成功退出登录',
            redirect: '/login'
        });
    });
});

// 修改密码API
router.post('/password', express.json(), async (req, res) => {
    if (!req.session || !req.session.user) {
        console.log(`[修改密码] 失败: 用户未登录`);
        return res.status(401).json({ error: '未登录或会话已过期' });
    }
    
    const { currentPassword, newPassword } = req.body;
    const username = req.session.user.username;
    
    console.log(`[修改密码] 用户 ${username} 尝试修改密码`);
    
    if (!currentPassword || !newPassword) {
        console.log(`[修改密码] 失败: 当前密码或新密码为空`);
        return res.status(400).json({ error: '当前密码和新密码不能为空' });
    }
    
    const result = await userAuthService.changePassword(
        req.session.user.id,
        currentPassword,
        newPassword
    );
    
    if (result.success) {
        console.log(`[修改密码] 成功: 用户 ${username} 密码已更新`);
        res.json({
            status: 'success',
            message: result.message
        });
    } else {
        console.log(`[修改密码] 失败: ${result.message}`);
        res.status(400).json({
            error: result.message
        });
    }
});

// 用户注册API - 仅在初始设置时可用
router.post('/register', express.json(), async (req, res) => {
    console.log(`[注册] 收到注册请求`);
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        console.log(`[注册] 失败: 用户名或密码为空`);
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    try {
        const hasAdmin = await userAuthService.hasInitialAdmin();
        console.log(`[注册] 检查管理员: hasAdmin=${hasAdmin}`);
        if (hasAdmin && (!req.session || !req.session.user || !req.session.user.isAdmin)) {
            console.log(`[注册] 失败: 系统已初始化，非管理员用户尝试注册`);
            return res.status(403).json({ error: '系统已初始化，只有管理员可以添加用户' });
        }
        // 如果没有管理员，则第一个注册的用户强制设为管理员
        const isFirstUserAdmin = !hasAdmin || isAdmin;

        // 尝试创建用户
        const user = await userAuthService.registerUser(username, password, isFirstUserAdmin);
        console.log(`[注册] 成功: 用户 ${username} 已创建, ID=${user.id}, isAdmin=${user.isAdmin}`);
        
        res.json({
            status: 'success',
            message: '用户创建成功',
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error(`[注册] 检查管理员失败:`, error);

        if (error.message === '用户已存在') {
            return res.status(400).json({ error: '用户名已存在' });
        }
        console.error(`[注册] 失败:`, error);
        res.status(500).json({ error: '注册用户失败，请稍后再试' });
    }
});

// 获取当前用户状态
router.get('/status', (req, res) => {
    const isLoggedIn = !!(req.session && req.session.user);
    console.log(`[状态] 用户状态: loggedIn=${isLoggedIn}, 用户=${isLoggedIn ? req.session.user.username : '未登录'}`);
    
    if (isLoggedIn) {
        res.json({
            loggedIn: true,
            user: {
                username: req.session.user.username,
                isAdmin: req.session.user.isAdmin
            }
        });
    } else {
        res.json({
            loggedIn: false
        });
    }
});

// 获取系统初始设置状态
router.get('/setup-status', async (req, res) => {
    let hasAdmin = false;
    
    try {
        hasAdmin = await userAuthService.hasInitialAdmin();
        console.log(`[设置状态] 检查: hasAdmin=${hasAdmin}`);
        
        res.json({
            needsSetup: !hasAdmin
        });
    } catch (error) {
        console.error(`[设置状态] 检查失败:`, error);
        res.status(500).json({ error: '检查设置状态失败' });
    }
    
});

module.exports = router;
