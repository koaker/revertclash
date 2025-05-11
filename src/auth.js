const fs = require('fs').promises;
const path = require('path');

const AUTH_CONFIG_FILE = path.join(__dirname, '..', 'auth-config.json');

// 读取认证配置
async function loadAuthConfig() {
    try {
        const configStr = await fs.readFile(AUTH_CONFIG_FILE, 'utf8');
        return JSON.parse(configStr);
    } catch (err) {
        // 如果配置文件不存在，创建默认配置
        const defaultConfig = {
            password: 'admin',
            maxAttemptsPerDay: 10,
            authMethod: 'jwt', // 默认使用JWT认证
            allowIpPasswordAuth: false, // 默认禁用IP密码认证
            jwtSecret: require('crypto').randomBytes(64).toString('hex'), // 生成随机JWT密钥
            users: []
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
    maxAttemptsPerDay: 10,
    authMethod: 'jwt',
    allowIpPasswordAuth: false,
    jwtSecret: '',
    users: []
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

module.exports = {
    loadAuthConfig,
    saveAuthConfig,
    authConfig
};
