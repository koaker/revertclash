const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadConfig() {
    try {
        const configPath = path.join(__dirname, '..', '..', 'configs', 'config.yaml');

        const configFile = fs.readFileSync(configPath, 'utf8');
        if (!configFile) {
            throw new Error('配置文件不存在或内容为空');
        }

        const parsedConfig = yaml.load(configFile);
        if (!parsedConfig) {
            throw new Error('配置文件内容为空或格式不正确');
        }

        parsedConfig.server.http.port = process.env.PORT || parsedConfig.server.http.port;
        parsedConfig.server.https.port = process.env.HTTPS_PORT || parsedConfig.server.https.port;
        parsedConfig.environment = process.env.NODE_ENV || parsedConfig.environment;

        return parsedConfig;

    } catch (error) {
        console.error(`加载配置文件失败: ${error.message}`);
        throw error;
    }
}

const config = loadConfig();

module.exports = config;