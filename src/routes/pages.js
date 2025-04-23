const express = require('express');
const path = require('path');

const router = express.Router();

// 主页路由
router.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'home.html'));
});

// 管理页面路由
router.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'manage.html'));
});

// 节点管理页面路由
router.get('/nodes', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'nodes.html'));
});

// 根路由重定向到home
router.get('/', (req, res) => {
    res.redirect('/home');
});

module.exports = router;
