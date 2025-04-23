const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const { processConfigs } = require('./config');
const app = require('./app');
const { loadAuthConfig } = require('./auth');

// 监控URL配置文件
const CONFIG_FILE = path.join(__dirname, '..', 'clash-urls.txt');

// 定期处理配置的间隔时间(毫秒)
const UPDATE_INTERVAL = 1000 * 60 * 30; // 30分钟

async function startServer() {
    const PORT = process.env.PORT || 3000;
    const authConfig = await loadAuthConfig();
    
    // 启动 HTTP 服务
    app.listen(PORT, () => {
        console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
    });

    try {
        // 读取SSL证书文件
        const [key, cert, ca] = await Promise.all([
            fs.readFile(path.join(__dirname, '..', 'ssl', 'private.key')),
            fs.readFile(path.join(__dirname, '..', 'ssl', 'certificate.crt')),
            fs.readFile(path.join(__dirname, '..', 'ssl', 'ca_bundle.crt'))
        ]);

        // 创建HTTPS服务器
        const httpsServer = https.createServer({
            key: key,
            cert: cert,
            ca: ca    // 添加CA证书链
        }, app);

        // 启动HTTPS服务
        const HTTPS_PORT = process.env.HTTPS_PORT || 3001;
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS服务器已启动: https://localhost:${HTTPS_PORT}`);
            console.log(`配置文件地址: https://localhost:${HTTPS_PORT}/config`);
            console.log(`默认验证密码: ${authConfig.password}`);
        });
    } catch (err) {
        console.log('未找到SSL证书文件，仅启动HTTP服务');
        console.log(`配置文件地址: http://localhost:${PORT}/config`);
        console.log(`默认验证密码: ${authConfig.password}`);
    }
}

async function main() {
    console.log('启动RevertClash服务...');
    
    // 启动HTTP服务器
    await startServer();

    // 监控配置文件变化
    chokidar.watch(CONFIG_FILE).on('all', (event, path) => {
        console.log(`检测到配置文件变化: ${event}`);
        processConfigs();
    });

    // 定期更新配置
    setInterval(processConfigs, UPDATE_INTERVAL);
    
    // 初始处理
    await processConfigs();
}

main().catch(console.error);