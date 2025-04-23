const fs = require('fs').promises;
const path = require('path');

const AUTH_CONFIG_FILE = path.join(__dirname, '..', 'auth-config.json');
const authorizedIPs = new Set();
const authAttempts = new Map(); // 记录IP验证尝试次数

// 获取当前日期的字符串（用于重置计数）
const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

// 读取认证配置
async function loadAuthConfig() {
    try {
        const configStr = await fs.readFile(AUTH_CONFIG_FILE, 'utf8');
        return JSON.parse(configStr);
    } catch (err) {
        // 如果配置文件不存在，创建默认配置
        const defaultConfig = {
            password: 'admin',
            maxAttemptsPerDay: 10
        };
        await fs.writeFile(AUTH_CONFIG_FILE, JSON.stringify(defaultConfig, null, 4));
        return defaultConfig;
    }
}

// 保存认证配置
async function saveAuthConfig(config) {
    await fs.writeFile(AUTH_CONFIG_FILE, JSON.stringify(config, null, 4));
}

// 默认配置，将在加载后被覆盖
let authConfig = {
    password: 'admin',
    maxAttemptsPerDay: 10
};

// 立即加载配置（同步初始化）
(async function initAuthConfig() {
    try {
        const config = await loadAuthConfig();
        // 修改对象属性而不是重新赋值整个对象
        Object.assign(authConfig, config);
        console.log('认证配置已加载:', authConfig);
    } catch (err) {
        console.error('加载认证配置失败:', err);
    }
})();

// 检查并更新验证尝试次数
const checkAuthAttempts = (ip) => {
    const today = getToday();
    const attempts = authAttempts.get(ip) || {};
    
    // 如果是新的一天，重置计数
    if (attempts.date !== today) {
        attempts.count = 0;
        attempts.date = today;
    }
    
    // 检查是否超过限制
    if (attempts.count >= authConfig.maxAttemptsPerDay) {
        return false;
    }
    
    // 更新尝试次数
    attempts.count += 1;
    authAttempts.set(ip, attempts);
    return true;
};

// 获取剩余尝试次数
const getRemainingAttempts = (ip) => {
    const today = getToday();
    const attempts = authAttempts.get(ip) || { date: today, count: 0 };
    
    if (attempts.date !== today) {
        return authConfig.maxAttemptsPerDay;
    }
    
    return Math.max(0, authConfig.maxAttemptsPerDay - attempts.count);
};

// 验证IP是否已授权
const isAuthorized = (ip) => {
    return authorizedIPs.has(ip);
};

// 授权IP
const authorizeIP = (ip) => {
    authorizedIPs.add(ip);
};

// 撤销IP授权
const deauthorizeIP = (ip) => {
    return authorizedIPs.delete(ip);
};

// 获取所有已授权IP
const getAuthorizedIPs = () => {
    return Array.from(authorizedIPs);
};

module.exports = {
    loadAuthConfig,
    saveAuthConfig,
    authConfig,
    checkAuthAttempts,
    getRemainingAttempts,
    isAuthorized,
    authorizeIP,
    deauthorizeIP,
    getAuthorizedIPs,
    getToday
};
