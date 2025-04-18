const fs = require('fs').promises;
const path = require('path');
const YAML = require('yaml');

class ConfigManager {
    constructor(configsDir) {
        this.configsDir = configsDir;
    }

    async listConfigs() {
        try {
            const files = await fs.readdir(this.configsDir);
            const configs = [];
            
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const filePath = path.join(this.configsDir, file);
                    const stat = await fs.stat(filePath);
                    
                    configs.push({
                        name: file,
                        path: filePath,
                        size: stat.size,
                        modifiedTime: stat.mtime
                    });
                }
            }
            
            return configs;
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.mkdir(this.configsDir, { recursive: true });
                return [];
            }
            throw err;
        }
    }

    async readConfig(fileName) {
        const filePath = path.join(this.configsDir, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        return {
            content,
            parsed: YAML.parse(content)
        };
    }

    async saveConfig(fileName, content) {
        // 验证YAML格式
        try {
            YAML.parse(content);
        } catch (err) {
            throw new Error('无效的YAML格式: ' + err.message);
        }

        const filePath = path.join(this.configsDir, fileName);
        
        // 确保文件扩展名是.yaml
        if (!fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
            throw new Error('配置文件必须以.yaml或.yml结尾');
        }

        // 确保目录存在
        await fs.mkdir(this.configsDir, { recursive: true });
        
        await fs.writeFile(filePath, content);
        return fileName;
    }

    async deleteConfig(fileName) {
        const filePath = path.join(this.configsDir, fileName);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error('配置文件不存在');
            }
            throw err;
        }
    }

    getConfigPath(fileName) {
        return path.join(this.configsDir, fileName);
    }

    validateFileName(fileName) {
        // 检查后缀名
        if (!fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
            throw new Error('配置文件必须以.yaml或.yml结尾');
        }

        // 检查文件名长度
        const nameWithoutExt = fileName.replace(/\.(yaml|yml)$/, '');
        if (nameWithoutExt.length === 0) {
            throw new Error('文件名不能为空');
        }

        // 检查是否包含非法字符（Windows文件系统限制字符）
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(fileName)) {
            throw new Error('文件名不能包含以下字符: < > : " / \\ | ? *');
        }
    }
}

module.exports = {
    ConfigManager,
    CONFIGS_DIR: path.join(__dirname, '..', 'configs')
};