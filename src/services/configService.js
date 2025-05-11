const fs = require('fs').promises;
const path = require('path');
const db = require('../db');
const { OUTPUT_FILE, PROCESSED_OUTPUT_FILE } = require('../config');

/**
 * 获取指定用户的最新配置
 * @param {number} userId - 用户ID
 * @param {string} configType - 配置类型 (config, processed-config, selected-config, merged-config)
 * @returns {Promise<Object|null>} 配置对象，没有找到则返回null
 */
async function getLatestConfigByUserId(userId, configType) {
    try {
        // 根据配置类型返回相应的配置文件
        let filePath;
        let contentType = 'text/yaml';
        
        switch (configType) {
            case 'config':
                filePath = OUTPUT_FILE;
                break;
            case 'processed-config':
                filePath = PROCESSED_OUTPUT_FILE;
                break;
            case 'selected-config':
                // 未来可以实现用户自定义选择的节点配置
                filePath = OUTPUT_FILE; // 暂时返回默认配置
                break;
            case 'merged-config':
                // 未来可以实现用户合并的配置
                filePath = OUTPUT_FILE; // 暂时返回默认配置
                break;
            default:
                return null;
        }

        // 读取配置文件
        const content = await fs.readFile(filePath, 'utf8');
        
        return {
            userId,
            type: configType,
            content,
            contentType,
            updatedAt: new Date()
        };
    } catch (err) {
        console.error(`获取用户 ${userId} 的 ${configType} 配置失败:`, err);
        return null;
    }
}

/**
 * 获取所有可用的配置类型
 * @returns {string[]} 配置类型数组
 */
function getAvailableConfigTypes() {
    return ['config', 'processed-config', 'selected-config', 'merged-config'];
}

/**
 * 检查配置类型是否有效
 * @param {string} configType - 要检查的配置类型
 * @returns {boolean} 是否有效
 */
function isValidConfigType(configType) {
    return getAvailableConfigTypes().includes(configType);
}

module.exports = {
    getLatestConfigByUserId,
    getAvailableConfigTypes,
    isValidConfigType
}; 