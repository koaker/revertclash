const express = require('express');
const userAuthService = require('../services/userAuth');
const db = require('../db'); // 添加数据库直接引用

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
    
    // 检查是否是初始设置
    let hasAdmin = false;
    try {
        hasAdmin = await userAuthService.hasInitialAdmin();
        console.log(`[注册] 检查管理员: hasAdmin=${hasAdmin}, needInitialSetup=${global.needInitialSetup}`);
    } catch (error) {
        console.error(`[注册] 检查管理员失败:`, error);
    }
    
    if (hasAdmin && (!req.session || !req.session.user || !req.session.user.isAdmin)) {
        console.log(`[注册] 失败: 系统已初始化，非管理员用户尝试注册`);
        return res.status(403).json({ error: '系统已初始化，只有管理员可以添加用户' });
    }
    
    const { username, password, isAdmin } = req.body;
    
    console.log(`[注册] 用户信息: username=${username}, isAdmin=${isAdmin}`);
    
    if (!username || !password) {
        console.log(`[注册] 失败: 用户名或密码为空`);
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    try {
        // 尝试创建用户
        const user = await userAuthService.registerUser(username, password, isAdmin);
        console.log(`[注册] 成功: 用户 ${username} 已创建, ID=${user.id}, isAdmin=${user.isAdmin}`);
        
        // 显式更新全局设置状态
        global.needInitialSetup = false;
        console.log(`[注册] 更新全局状态: needInitialSetup=${global.needInitialSetup}`);
        
        // 进行双重检查确认用户已存在
        try {
            const userCount = await db.get('SELECT COUNT(*) as count FROM users');
            console.log(`[注册] 数据库用户数量检查: ${userCount.count}`);
            
            if (userCount.count > 0) {
                global.needInitialSetup = false;
                console.log(`[注册] 数据库确认有用户，已更新needInitialSetup=${global.needInitialSetup}`);
            }
        } catch (err) {
            console.error(`[注册] 检查用户数量失败:`, err);
        }
        
        res.json({
            status: 'success',
            message: '用户创建成功',
            needInitialSetup: global.needInitialSetup,
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error(`[注册] 失败:`, error);
        res.status(400).json({
            error: error.message
        });
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
        console.log(`[设置状态] 检查: hasAdmin=${hasAdmin}, needInitialSetup=${global.needInitialSetup}`);
        
        // 根据数据库查询结果更新全局状态
        if (hasAdmin && global.needInitialSetup) {
            global.needInitialSetup = false;
            console.log(`[设置状态] 更新全局状态: needInitialSetup=${global.needInitialSetup}`);
        }
    } catch (error) {
        console.error(`[设置状态] 检查失败:`, error);
        hasAdmin = false;
    }
    
    res.json({
        needsSetup: !hasAdmin
    });
});

// 添加重置设置状态API - 用于手动重置安装状态
router.post('/reset-setup', express.json(), async (req, res) => {
    console.log(`[重置设置] 请求重置设置状态`);
    
    // 只允许管理员或未初始化状态下重置
    if (global.needInitialSetup === false && (!req.session || !req.session.user || !req.session.user.isAdmin)) {
        console.log(`[重置设置] 失败: 需要管理员权限`);
        return res.status(403).json({ error: '需要管理员权限才能重置设置状态' });
    }
    
    try {
        // 检查用户数量
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        console.log(`[重置设置] 数据库用户数量: ${userCount.count}`);
        
        global.needInitialSetup = userCount.count === 0;
        console.log(`[重置设置] 更新全局状态: needInitialSetup=${global.needInitialSetup}`);
        
        res.json({
            status: 'success',
            message: '设置状态已重置',
            needInitialSetup: global.needInitialSetup
        });
    } catch (error) {
        console.error(`[重置设置] 失败:`, error);
        res.status(500).json({
            error: '重置设置状态失败: ' + error.message
        });
    }
});

module.exports = router;
