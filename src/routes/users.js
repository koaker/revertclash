const express = require('express');
const db = require('../db');
const { adminAuthMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// 所有用户路由需要管理员权限
router.use(adminAuthMiddleware);

// 获取用户列表
router.get('/', async (req, res) => {
    try {
        const users = await db.all(
            'SELECT id, username, is_admin, created_at, updated_at FROM users'
        );
        
        res.json({
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin === 1,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }))
        });
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
        const user = await db.get(
            'SELECT id, username, is_admin, created_at, updated_at FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (!user) {
            return res.status(404).json({
                error: '用户不存在'
            });
        }
        
        res.json({
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin === 1,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
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
        const admins = await db.all('SELECT id FROM users WHERE is_admin = 1');
        if (admins.length === 1 && admins[0].id === parseInt(req.params.id)) {
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

        const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                error: '用户不存在'
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

module.exports = router; 