const path = require('path');

// 引入重构后的主配置管理器
const ConfigManager = require('./managers/ConfigManager');
const { parseUserInfoHeader, readUserInfoData, writeUserInfoData } = require('./subscription/userInfoManager');
const ConfigCacheService = require('./services/configCacheService');

// 配置缓存设置（保持向后兼容）
const CONFIG_CACHE_SETTINGS = {
    DEFAULT_EXPIRE_HOURS: 24,        // 默认缓存过期时间（小时）
    MAX_EXPIRE_HOURS: 8760,          // 最大缓存时间（365天）
    MIN_EXPIRE_HOURS: 1,             // 最小缓存时间（1小时）
    AUTO_CLEANUP_DAYS: 7             // 自动清理过期缓存的天数
};

// 配置文件路径（保持向后兼容）
const OUTPUT_FILE = path.join(__dirname, '../data', 'merged-config.yaml');
const PROCESSED_OUTPUT_FILE = path.join(__dirname, '../data', 'processed-merged-config.yaml');

// 创建全局配置管理器实例
const configManager = new ConfigManager({
    configsDir: path.join(__dirname, '..', 'configs'),
    outputFile: OUTPUT_FILE,
    processedOutputFile: PROCESSED_OUTPUT_FILE,
    urlConfigFile: path.join(__dirname, '..', 'clash-urls.txt'),
    enableCache: true,
    enableConflictResolution: true,
    enableFiltering: true,
    cacheExpireHours: CONFIG_CACHE_SETTINGS.DEFAULT_EXPIRE_HOURS
});

/**
 * 读取本地 configs 目录下的 YAML 文件
 * @deprecated 此函数已被新架构中的ConfigManager替代，保留用于兼容性
 * @returns {Promise<object[]>} 返回包含 Clash 代理配置对象的数组
 */
async function readLocalConfigs() {
    console.warn('readLocalConfigs已废弃，请使用ConfigManager');
    return [];
}

/**
 * 合并来自不同来源的代理节点列表
 * @deprecated 此函数已被新架构中的NodeAggregator替代，保留用于兼容性
 * @param {object[][]} proxyLists - 包含多个代理节点数组的数组
 * @returns {object[]} - 合并并去重后的代理节点数组
 */
function aggregateProxies(proxyLists) {
    console.warn('aggregateProxies已废弃，请使用NodeAggregator');
    return [];
}

/**
 * 生成基础的 Clash 配置结构 (不含代理)
 * @deprecated 此函数已被新架构中的ConfigManager替代，保留用于兼容性
 * @returns {object}
 */
function createBaseClashConfig() {
    console.warn('createBaseClashConfig已废弃，请使用ConfigManager');
    return {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': true,
        mode: 'rule',
        'log-level': 'info',
        proxies: [],
        'proxy-groups': [],
        rules: ['MATCH,DIRECT']
    };
}

/**
 * 主流程：处理所有配置来源并生成最终文件
 * 重构版本使用新的ConfigManager架构
 */
async function processConfigs() {
    try {
        console.log('开始处理配置 (重构版 v2.0)...');
        
        // 读取并保存用户信息（保持兼容性）
        const currentUserInfo = await readUserInfoData();
        let newUserInfo = { ...currentUserInfo };
        
        // 使用新的ConfigManager处理配置
        const result = await configManager.processConfigs();
        
        console.log('=== 处理结果摘要 ===');
        console.log(`配置源: ${result.sources.success}/${result.sources.total} 成功`);
        console.log(`节点数量: ${result.nodes.total} 个`);
        console.log(`处理时间: ${result.duration}ms`);
        
        // 处理用户信息更新（如果有的话）
        // 这里可以从ConfigManager的结果中提取用户信息更新
        // 暂时保持现有用户信息不变
        await writeUserInfoData(newUserInfo);
        
        // 定期清理过期缓存
        try {
            const cleanedCount = await ConfigCacheService.cleanupExpiredConfigs(CONFIG_CACHE_SETTINGS.AUTO_CLEANUP_DAYS);
            if (cleanedCount > 0) {
                console.log(`配置处理完成时清理了 ${cleanedCount} 个过期缓存`);
            }
        } catch (cleanupErr) {
            console.error('清理过期缓存时出错:', cleanupErr.message);
        }
        
        console.log('配置处理流程完成 (重构版)。');
        return result;
        
    } catch (error) {
        console.error('配置处理失败 (重构版):', error.message);
        
        // 降级到基础处理（如果ConfigManager失败）
        console.log('尝试降级处理...');
        
        try {
            // 至少保证用户信息的处理
            const currentUserInfo = await readUserInfoData();
            await writeUserInfoData(currentUserInfo);
            
            console.warn('降级处理完成，但配置生成可能不完整');
        } catch (fallbackError) {
            console.error('降级处理也失败:', fallbackError.message);
        }
        
        throw error;
    }
}

module.exports = {
    // 主要接口（重构后）
    processConfigs,
    
    // 新架构组件
    configManager,
    
    // 向后兼容导出
    OUTPUT_FILE,
    PROCESSED_OUTPUT_FILE,
    CONFIG_CACHE_SETTINGS,
    
    // 废弃的函数（保留用于兼容性）
    readLocalConfigs,
    aggregateProxies,
    createBaseClashConfig,
    
    // 新增的管理接口
    getConfigManager: () => configManager,
    getSystemStatus: () => configManager.getStatus(),
    getHealthReport: () => configManager.getHealthReport(),
    addConfigSource: (sourceId, type, config) => configManager.addSource(sourceId, type, config),
    removeConfigSource: (sourceId) => configManager.removeSource(sourceId),
    getNodeStatistics: () => configManager.getNodeStatistics()
};