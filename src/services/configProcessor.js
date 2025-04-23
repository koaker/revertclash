const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { processConfigs } = require('../config');

/**
 * 配置处理器类
 * 负责生成和处理Clash配置
 */
class ConfigProcessor {
    /**
     * 构造函数
     * @param {NodeManager} nodeManager - 节点管理器实例
     * @param {String} baseConfigPath - 基础配置文件路径
     */
    constructor(nodeManager, baseConfigPath = '') {
        this.nodeManager = nodeManager;
        this.baseConfigPath = baseConfigPath || path.join(__dirname, '../../configs/base.yaml');
        this.outputDir = path.join(__dirname, '../../');
    }

    /**
     * 读取基础配置
     * @returns {Object} - 基础配置对象
     */
    async readBaseConfig() {
        try {
            const baseConfig = await fs.readFile(this.baseConfigPath, 'utf8');
            return yaml.load(baseConfig);
        } catch (err) {
            if (err.code === 'ENOENT') {
                // 如果基础配置文件不存在，返回默认配置
                return {
                    port: 7890,
                    'socks-port': 7891,
                    'allow-lan': true,
                    mode: 'rule',
                    'log-level': 'info',
                    proxies: [],
                    'proxy-groups': [],
                    rules: []
                };
            }
            throw err;
        }
    }

    /**
     * 生成基础配置
     * @returns {Object} - 不包含节点的基础配置
     */
    async generateBaseConfig() {
        const baseConfig = await this.readBaseConfig();
        
        // 清空节点和代理组
        baseConfig.proxies = [];
        
        // 如果有代理组，保留组结构但清空内容
        if (baseConfig['proxy-groups'] && Array.isArray(baseConfig['proxy-groups'])) {
            baseConfig['proxy-groups'].forEach(group => {
                group.proxies = [];
            });
        }
        
        return baseConfig;
    }

    /**
     * 生成选中节点的配置
     * @returns {String} - 完整的配置YAML字符串
     */
    async generateSelectedConfig() {
        // 获取基础配置
        const baseConfig = await this.generateBaseConfig();
        
        // 获取选中的节点
        const selectedNodes = this.nodeManager.getSelectedNodes();
        
        if (selectedNodes.length === 0) {
            throw new Error('没有选中任何节点');
        }
        
        // 添加选中的节点到配置
        baseConfig.proxies = selectedNodes.map(node => node.details);
        
        // 更新代理组中的节点列表
        if (baseConfig['proxy-groups'] && Array.isArray(baseConfig['proxy-groups'])) {
            const nodeNames = selectedNodes.map(node => node.name);
            
            baseConfig['proxy-groups'].forEach(group => {
                // 对于select类型的组，添加所有节点
                if (group.type === 'select') {
                    group.proxies = [...nodeNames];
                }
                // 对于url-test, fallback等类型的组，也添加所有节点
                else if (['url-test', 'fallback', 'load-balance'].includes(group.type)) {
                    group.proxies = [...nodeNames];
                }
            });
        }
        
        // 转换为YAML字符串
        return yaml.dump(baseConfig);
    }

    /**
     * 保存选中节点的配置到文件
     * @param {String} fileName - 文件名
     * @returns {String} - 保存的文件路径
     */
    async saveSelectedConfig(fileName = 'selected-config.yaml') {
        const config = await this.generateSelectedConfig();
        const filePath = path.join(this.outputDir, fileName);
        await fs.writeFile(filePath, config, 'utf8');
        return filePath;
    }

    /**
     * 处理选中节点的配置
     * @param {Boolean} keepTempFiles - 是否保留临时文件
     * @returns {String} - 处理后的配置YAML字符串
     */
    async processSelectedConfig(keepTempFiles = true) {
        // 临时文件名
        const tempFile = 'temp-selected-config.yaml';
        const processedTempFile = 'processed-temp-selected-config.yaml';
        
        // 先保存选中节点的配置
        await this.saveSelectedConfig(tempFile);
        
        // 使用clash-configs.js处理配置
        await processConfigs(path.join(this.outputDir, tempFile));
        
        // 读取处理后的配置
        const processedPath = path.join(this.outputDir, processedTempFile);
        const processedConfig = await fs.readFile(processedPath, 'utf8');
        
        // 如果不需要保留临时文件，则清理
        if (!keepTempFiles) {
            try {
                await fs.unlink(path.join(this.outputDir, tempFile));
                await fs.unlink(processedPath);
            } catch (err) {
                console.warn('清理临时文件失败:', err.message);
            }
        }
        
        return processedConfig;
    }

    /**
     * 保存处理后的配置到文件
     * @param {String} fileName - 文件名
     * @returns {String} - 保存的文件路径
     */
    async saveProcessedConfig(fileName = 'processed-selected-config.yaml') {
        const config = await this.processSelectedConfig();
        const filePath = path.join(this.outputDir, fileName);
        await fs.writeFile(filePath, config, 'utf8');
        return filePath;
    }
}

module.exports = ConfigProcessor;
