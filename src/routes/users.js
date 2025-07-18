const express = require('express');
const { adminAuthMiddleware } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const UserManager = require('../managers/UserManager');

const router = express.Router();

// 所有用户路由需要管理员权限
router.use(adminAuthMiddleware);

// 获取用户列表
router.get('/', async (req, res) => {
    try {
        const users = await UserManager.getAllUsers();
        if (!users || users.length === 0) {
            return res.status(404).json({
                error: '没有找到用户'
            });
        }
        res.json(users);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            error: '获取用户列表失败'
        });
    }
});

// 获取单个用户
router.get('/:id', async (req, res) => {
    try {
        const user = await UserManager.getUserById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                error: '用户不存在'
            });
        }
        res.json(user);
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            error: '获取用户信息失败'
        });
    }
});

// 删除用户
router.delete('/:id', async (req, res) => {
    try {
        // 检查是否为最后一个管理员
        const adminsCounts = await UserManager.getAdminCount();
        if (adminsCounts === 1) {
            return res.status(400).json({
                error: '无法删除唯一的管理员账号'
            });
        }
        
        // 不允许删除自己的账号
        if (req.session.user.id === parseInt(req.params.id)) {
            return res.status(400).json({
                error: '您不能删除自己的账号'
            });
        }
        // 检查用户是否存在
        const userExists = await UserManager.userExists(req.params.id);
        if (!userExists) {
            return res.status(404).json({
                error: '用户不存在'
            });
        }
        const result = await UserManager.deleteUserById(req.params.id);
        if (!result || !result.success) {
            return res.status(500).json({
                error: '删除用户失败'
            });
        }
        
        res.json({
            status: 'success',
            message: '用户已删除'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            error: '删除用户失败'
        });
    }
});

// 添加用户
router.post('/', async (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            error: '用户名和密码不能为空'
        });
    }
    // 检查用户名是否已存在
    const userExists = await UserManager.getUserByUsername(username);
    if (userExists) {
        return res.status(400).json({
            error: '用户名已存在'
        });
    }
    // 对密码进行hash
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
        const newUser = await UserManager.createUser(username, passwordHash, isAdmin);
        if (!newUser) {
            return res.status(500).json({
                error: '添加用户失败'
            });
        }
        res.status(201).json({
            status: 'success',
            message: '用户创建成功',
        });
    } catch (error) {
        console.error('添加用户失败:', error);
        res.status(500).json({
            error: '添加用户失败'
        });
    }
})
module.exports = router; 