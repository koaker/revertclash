const chokidar = require('chokidar');
const path = require('path');
const { processConfigs } = require('./config');
const { startServer } = require('./server');

// 监控URL配置文件
const CONFIG_FILE = path.join(__dirname, '..', 'clash-urls.txt');

// 定期处理配置的间隔时间(毫秒)
const UPDATE_INTERVAL = 1000 * 60 * 30; // 30分钟

async function main() {
    console.log('启动RevertClash服务...');
    
    // 启动HTTP服务器
    startServer();

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