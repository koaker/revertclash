const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const app = require('./app');
const { initDatabase, get } = require('./db');
const userAuthService = require('./services/userAuth');
const config = require('./config/config');


async function getSslCredentials() {
    const sslDir = path.join(__dirname, '..', 'ssl');

    try {
        const key = await fs.readFile(path.join(sslDir, 'privkey.pem'));
        const cert = await fs.readFile(path.join(sslDir, 'fullchain.pem'));
        return { key, cert };
    } catch (error) {
        console.log('未找到.pem格式的SSL证书文件，将使用.crt格式');

        try {
            const key = await fs.readFile(path.join(sslDir, 'private.key'));
            const cert = await fs.readFile(path.join(sslDir, 'certificate.crt'));
            // 如果有CA证书链，也读取它
            const ca = await fs.readFile(path.join(sslDir, 'ca_bundle.crt'));
            return { key, cert, ca };

        } catch (error) {
            console.error(`读取SSL证书失败: ${error.message}`);
            throw new Error('未找到有效的SSL证书文件，请检查ssl目录');
        }
    }
}
async function startServer() {
    const PORT = config.server.http.port;
    
    console.log('启动HTTP服务器...');
    // 启动 HTTP 服务
    const httpServer = app.listen(PORT, () => {
        console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
    });

    try {
        // 读取SSL证书文件
        const sslCredentials = await getSslCredentials();

        // 创建HTTPS服务器
        const httpsServer = https.createServer(sslCredentials, app);

        // 启动HTTPS服务
        const HTTPS_PORT = config.server.https.port;
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS服务器已启动: https://localhost:${HTTPS_PORT}`);
            console.log(`配置文件地址: https://localhost:${HTTPS_PORT}/config`);
        });
        
        return { httpServer, httpsServer };
    } catch (err) {
        // 检查是否为生产环境
        if (process.env.NODE_ENV === 'production') {
            console.error('生产环境启动失败：未找到SSL证书文件。');
            process.exit(1); // 在生产环境中强制退出
        }
        console.log('未找到SSL证书文件，仅启动HTTP服务');
        console.log(`配置文件地址: http://localhost:${PORT}/config`);

        return { httpServer };
    }
}

async function initialDatabase() {
    console.log('初始化数据库开始');

    try {
        await initDatabase();
        
        const tableCheck = await get ("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        if (tableCheck) {
            console.log('用户表已存在，检查是否有用户');
            // 然后检查是否需要初始设置
            const hasAdmin = await userAuthService.hasInitialAdmin();
            console.log(`检查用户结果: hasAdmin=${hasAdmin}`);
        } else {
            console.log('用户表不存在，需要初始设置');
        }
    } catch (error) {
        console.error('检查数据库表失败:', error);
        throw error;
    }
}

function shutdownServer(servers) {
    const gracefulShutdown = () => {
        console.log('收到关闭信号，关闭服务器...');
        let serversToClose = 1;
        if (servers.httpsServer) {
            serversToClose++;
        }

        const onServerClosed = () => {
            serversToClose--;
            if (serversToClose === 0) {
                console.log('所有服务器已关闭，应用退出。');
                process.exit(0);
            }
        };

        servers.httpServer.close(onServerClosed);

        if (servers.httpsServer) {
            servers.httpsServer.close(onServerClosed);
        }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    console.log('服务器关闭处理程序已设置');
}

async function main() {
    try {
        console.log('启动RevertClash服务...');
        
        await initialDatabase();

        // 然后启动HTTP服务器
        const servers = await startServer();
        
        shutdownServer(servers);

        console.log('RevertClash服务初始化完成');
    } catch (error) {
        console.error('启动RevertClash服务失败:', error);
        process.exit(1);
    }
}

main().catch(console.error);