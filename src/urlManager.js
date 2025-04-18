const fs = require('fs').promises;
const path = require('path');

class URLManager {
    constructor(configFile) {
        this.configFile = configFile;
    }

    async readUrls() {
        try {
            const content = await fs.readFile(this.configFile, 'utf8');
            const urls = [];
            
            content.split('\n').forEach(line => {
                line = line.trim();
                if (!line || line.startsWith('#')) return;
                
                const firstEqualIndex = line.indexOf('=');
                if (firstEqualIndex > 0) {
                    const name = line.substring(0, firstEqualIndex).trim();
                    const url = line.substring(firstEqualIndex + 1).trim();
                    if (url) {
                        urls.push({ name, url });
                    }
                }
            });
            
            return urls;
        } catch (err) {
            if (err.code === 'ENOENT') {
                await this.initializeFile();
                return [];
            }
            throw err;
        }
    }

    async saveUrls(urls) {
        const content = [
            '# Clash配置URL列表',
            '# 在下方添加你的Clash订阅链接，格式为：名称=URL',
            ''
        ];

        urls.forEach(({ name, url }) => {
            content.push(`${name}=${url}`);
        });

        await fs.writeFile(this.configFile, content.join('\n'));
    }

    async addUrl(name, url) {
        const urls = await this.readUrls();
        
        // 检查名称是否已存在
        if (urls.some(u => u.name === name)) {
            throw new Error('名称已存在');
        }

        urls.push({ name, url });
        await this.saveUrls(urls);
        return { name, url };
    }

    async updateUrl(oldName, newName, newUrl) {
        const urls = await this.readUrls();
        
        // 检查老的名称是否存在
        const index = urls.findIndex(u => u.name === oldName);
        if (index === -1) {
            throw new Error('URL不存在');
        }

        // 如果更改了名称，检查新名称是否已存在
        if (oldName !== newName && urls.some(u => u.name === newName)) {
            throw new Error('新名称已存在');
        }

        urls[index] = { name: newName, url: newUrl };
        await this.saveUrls(urls);
        return urls[index];
    }

    async deleteUrl(name) {
        const urls = await this.readUrls();
        const filteredUrls = urls.filter(u => u.name !== name);
        
        if (filteredUrls.length === urls.length) {
            throw new Error('URL不存在');
        }

        await this.saveUrls(filteredUrls);
    }

    async initializeFile() {
        const content = [
            '# Clash配置URL列表',
            '# 在下方添加你的Clash订阅链接，格式为：名称=URL',
            '# 示例:',
            '# HK节点=https://example.com/clash/hk.yaml',
            '# US节点=https://example.com/clash/us.yaml',
            ''
        ].join('\n');

        await fs.writeFile(this.configFile, content);
    }
}

module.exports = {
    URLManager,
    CONFIG_FILE: path.join(__dirname, '..', 'clash-urls.txt')
};