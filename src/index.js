const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const { processConfigs, getConfigManager, initializeNodeManager } = require('./config');
const app = require('./app');
const { loadAuthConfig } = require('./auth');
const db = require('./db');
const userAuthService = require('./services/userAuth');

// 监控URL配置文件
const CONFIG_FILE = path.join(__dirname, '..', 'clash-urls.txt');

// 定期处理配置的间隔时间(毫秒)
const UPDATE_INTERVAL = 1000 * 60 * 30; // 30分钟

async function startServer() {
    const PORT = process.env.PORT || 3000;
    const authConfig = await loadAuthConfig();
    
    console.log('启动HTTP服务器...');
    // 启动 HTTP 服务
    const httpServer = app.listen(PORT, () => {
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
            if (global.needInitialSetup) {
                console.log(`系统需要初始设置，请访问: https://localhost:${HTTPS_PORT}/setup`);
            } else {
                console.log(`默认验证密码: ${authConfig.password}`);
            }
        });
        
        return { httpServer, httpsServer };
    } catch (err) {
        console.log('未找到SSL证书文件，仅启动HTTP服务');
        console.log(`配置文件地址: http://localhost:${PORT}/config`);
        if (global.needInitialSetup) {
            console.log(`系统需要初始设置，请访问: http://localhost:${PORT}/setup`);
        } else {
            console.log(`默认验证密码: ${authConfig.password}`);
        }
        
        return { httpServer };
    }
}

async function init() {
    try {
        console.log('启动 RevertClash 系统...');
        
        // 初始化数据库（如果存在）
        await initializeDatabase();
        
        // 初始化ConfigManager
        console.log('初始化配置管理器...');
        const configManager = getConfigManager();
        await configManager.initialize();
        console.log('配置管理器初始化完成');
        
        // 等待一小段时间确保ConfigManager完全就绪
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 初始化NodeManager并建立与ConfigManager的连接
        console.log('初始化节点管理器...');
        const nodeManager = await initializeNodeManager();
        console.log('节点管理器初始化完成，节点数量:', nodeManager.getNodes().length);
        
        // 处理初始配置
        console.log('处理初始配置...');
        await processConfigs();
        console.log('初始配置处理完成');
        
        // 再次检查NodeManager状态
        const finalNodeCount = nodeManager.getNodes().length;
        console.log(`系统初始化完成，当前节点数量: ${finalNodeCount}`);
        
        // 验证系统状态
        await validateSystemState();
        
    } catch (error) {
        console.error('系统初始化失败:', error.message);
        console.error('系统将以降级模式运行');
        
        // 即使初始化失败，也尝试基本的配置处理
        try {
            await processConfigs();
            console.log('降级模式配置处理完成');
        } catch (fallbackError) {
            console.error('降级模式也失败:', fallbackError.message);
        }
    }
}

// 验证系统状态
async function validateSystemState() {
    try {
        const { getConfigManager, getNodeManager } = require('./config');
        
        const configManager = getConfigManager();
        const nodeManager = getNodeManager();
        
        console.log('=== 系统状态验证 ===');
        console.log('ConfigManager状态:', configManager ? '已初始化' : '未初始化');
        console.log('NodeManager状态:', nodeManager ? '已初始化' : '未初始化');
        
        if (configManager) {
            const configStatus = configManager.getStatus();
            console.log('配置管理器状态:', configStatus.initialized ? '就绪' : '未就绪');
        }
        
        if (nodeManager) {
            const nodeStatus = nodeManager.getManagerStatus();
            console.log('节点管理器状态:', {
                节点总数: nodeStatus.totalNodes,
                配置源数: nodeStatus.configSources,
                ConfigManager连接: nodeStatus.hasConfigManager
            });
        }
        
        console.log('=== 状态验证完成 ===');
        
    } catch (error) {
        console.error('系统状态验证失败:', error.message);
    }
}

async function main() {
    try {
        console.log('启动RevertClash服务...');
        
        // 先初始化数据库
        console.log('正在初始化数据库...');
        await db.initDatabase(); // 确保先初始化数据库表
        
        // 初始化全局设置状态
        global.needInitialSetup = true; // 默认需要设置
        console.log(`初始化全局状态: needInitialSetup=${global.needInitialSetup}`);
        
        // 检查数据库表是否存在
        try {
            const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            if (tableCheck) {
                console.log('用户表已存在，检查是否有用户');
                // 然后检查是否需要初始设置
                const hasAdmin = await userAuthService.hasInitialAdmin();
                console.log(`检查用户结果: hasAdmin=${hasAdmin}`);
                global.needInitialSetup = !hasAdmin;
                console.log(`更新全局状态: needInitialSetup=${global.needInitialSetup}`);
            } else {
                console.log('用户表不存在，需要初始设置');
                global.needInitialSetup = true;
            }
        } catch (error) {
            console.error('检查数据库表失败:', error);
            global.needInitialSetup = true; // 出错时默认需要初始设置
        }
        
        if (global.needInitialSetup) {
            console.log('检测到系统需要初始设置，将在启动后引导您完成设置');
        } else {
            console.log('系统已初始化，无需初始设置');
        }
        
        // 然后启动HTTP服务器
        const servers = await startServer();
        
        // 系统初始化（包含ConfigManager和NodeManager）
        console.log('初始化重构后的配置系统...');
        await init();
        
        // 然后设置配置监控和处理
        console.log('设置配置文件监控...');
        
        // 创建防抖的配置处理函数
        let configProcessTimeout = null;
        const safeProcessConfigs = () => {
            if (configProcessTimeout) {
                clearTimeout(configProcessTimeout);
            }
            configProcessTimeout = setTimeout(() => {
                processConfigs().catch(err => {
                    console.error('配置处理出错:', err.message);
                });
            }, 1000); // 1秒防抖
        };
        
        // 监控配置文件变化
        chokidar.watch(CONFIG_FILE).on('all', (event, path) => {
            console.log(`检测到配置文件变化: ${event}`);
            safeProcessConfigs();
        });

        // 定期更新配置
        setInterval(safeProcessConfigs, UPDATE_INTERVAL);
        
        console.log('RevertClash服务初始化完成');
        console.log(`当前系统状态: needInitialSetup=${global.needInitialSetup}`);
    } catch (error) {
        console.error('启动RevertClash服务失败:', error);
        process.exit(1);
    }
}

main().catch(console.error);