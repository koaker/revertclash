const fs = require('fs').promises;
const YAML = require('yaml');
const path = require('path');

// 引入新的模块化组件
const { fetchSubscription } = require('./subscription/fetcher');
const parserManager = require('./subscription/parserManager');
const { parseUserInfoHeader, readUserInfoData, writeUserInfoData } = require('./subscription/userInfoManager');
const { URLManager, CONFIG_FILE: URL_CONFIG_FILE } = require('./urlManager'); // 从 urlManager 获取 URL 列表

// 配置文件路径 (可以考虑移到配置中心)
const CONFIGS_DIR = path.join(__dirname, '..', 'configs');
const OUTPUT_FILE = path.join(__dirname, '../data', 'merged-config.yaml');
const PROCESSED_OUTPUT_FILE = path.join(__dirname, '../data', 'processed-merged-config.yaml');

const urlManager = new URLManager(URL_CONFIG_FILE);

/**
 * 读取本地 configs 目录下的 YAML 文件
 * @returns {Promise<object[]>} 返回包含 Clash 代理配置对象的数组
 */
async function readLocalConfigs() {
    const configs = [];
    try {
        const files = await fs.readdir(CONFIGS_DIR);
        for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                try {
                    const filePath = path.join(CONFIGS_DIR, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    // 使用 parserManager 解析本地文件，确保格式统一
                    const parsedProxies = await parserManager.parse(content);
                    if (parsedProxies) {
                        console.log(`成功读取并解析本地配置: ${file}`);
                        const fileNamePrefix = file.replace(/\.(yaml|yml)$/, '');
                        // 添加文件名前缀
                        const prefixedProxies = parsedProxies.map(proxy => ({
                            ...proxy,
                            name: `${fileNamePrefix}|-|${proxy.name}`
                        }));
                        configs.push(...prefixedProxies);
                    } else {
                         console.warn(`无法解析本地配置文件: ${file}`);
                    }
                } catch (err) {
                    console.error(`读取本地配置失败 ${file}:`, err.message);
                }
            }
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('configs 目录不存在或为空');
        } else {
            console.error('读取本地配置目录失败:', err.message);
        }
    }
    return configs;
}

/**
 * 合并来自不同来源的代理节点列表
 * @param {object[][]} proxyLists - 包含多个代理节点数组的数组
 * @returns {object[]} - 合并并去重后的代理节点数组
 */
function aggregateProxies(proxyLists) {
    const allProxies = proxyLists.flat().filter(p => p); // 扁平化并移除 null/undefined
    // 使用 Map 按节点名称去重，后面的覆盖前面的
    const uniqueProxies = Array.from(
        new Map(allProxies.map(proxy => [proxy.name, proxy])).values()
    );
    console.log(`共聚合 ${uniqueProxies.length} 个唯一的代理节点`);
    return uniqueProxies;
}

/**
 * 生成基础的 Clash 配置结构 (不含代理)
 * @returns {object}
 */
function createBaseClashConfig() {
    // 可以考虑从一个 base.yaml 文件读取模板，或者硬编码
    return {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': true,
        mode: 'rule',
        'log-level': 'info',
        // external-controller: '127.0.0.1:9090', // 根据需要添加
        proxies: [], // 将由聚合后的节点填充
        'proxy-groups': [], // 将根据节点动态生成或使用模板
        rules: ['MATCH,DIRECT'] // 默认规则，可以从模板读取
    };
}

/**
 * 主流程：处理所有配置来源并生成最终文件
 */
async function processConfigs() {
    console.log('开始处理配置 (重构版)...');

    const allProxiesList = []; // 存储从各个来源获取的代理列表
    const currentUserInfo = await readUserInfoData(); // 读取现有的用户信息
    const newUserInfo = {}; // 存储本次更新获取的新用户信息

    // 1. 处理本地配置
    const localProxies = await readLocalConfigs();
    if (localProxies.length > 0) {
        allProxiesList.push(localProxies);
    }

    // 2. 处理 URL 订阅
    const urls = await urlManager.readUrls();
    if (urls.length > 0) {
        console.log(`发现 ${urls.length} 个配置 URL`);
        for (const { url, name } of urls) {
            console.log(`正在处理订阅: ${name} (${url})`);
            const { content, headers, error } = await fetchSubscription(url);

            if (error) {
                console.error(`获取订阅 ${name} 失败: ${error.message}`);
                // 即使下载失败，也尝试保留旧的用户信息（如果存在）
                if (currentUserInfo[name]) {
                    newUserInfo[name] = currentUserInfo[name];
                }
                continue; // 继续处理下一个 URL
            }

            if (content) {
                // 解析订阅内容
                const parsedProxies = await parserManager.parse(content);
                if (parsedProxies) {
                    // 添加前缀
                    const prefixedProxies = parsedProxies.map(proxy => ({
                        ...proxy,
                        name: `${name}|-|${proxy.name}`
                    }));
                    allProxiesList.push(prefixedProxies);
                } else {
                    console.warn(`无法解析订阅 ${name} 的内容`);
                }
            } else {
                 console.warn(`订阅 ${name} 的内容为空`);
            }


            // 处理用户信息
            const userInfoHeader = headers ? headers['subscription-userinfo'] : null;
            if (userInfoHeader) {
                const parsedInfo = parseUserInfoHeader(userInfoHeader);
                if (parsedInfo) {
                    newUserInfo[name] = parsedInfo;
                    console.log(`更新了 ${name} 的用户信息`);
                } else {
                    // 如果解析失败，尝试保留旧信息
                    if (currentUserInfo[name]) {
                        newUserInfo[name] = currentUserInfo[name];
                        console.log(`保留了 ${name} 的旧用户信息 (新信息解析失败)`);
                    }
                }
            } else {
                 // 如果没有头信息，尝试保留旧信息
                 if (currentUserInfo[name]) {
                    newUserInfo[name] = currentUserInfo[name];
                    console.log(`保留了 ${name} 的旧用户信息 (未提供新信息)`);
                 }
            }
        }
    } else {
        console.log('没有找到有效的配置 URL');
    }

    // 3. 聚合所有代理节点
    const finalUniqueProxies = aggregateProxies(allProxiesList);

    if (finalUniqueProxies.length === 0) {
        console.error('错误：未能获取或解析任何有效的代理节点，无法生成配置文件。');
        // 即使没有节点，也应该保存更新后的用户信息
        await writeUserInfoData(newUserInfo);
        return; // 提前退出
    }

    // 4. 生成最终配置
    const baseConfig = createBaseClashConfig();
    baseConfig.proxies = finalUniqueProxies;
    // 动态生成或填充代理组 (简化示例：只创建一个包含所有节点的 select 组)
    baseConfig['proxy-groups'] = [
        {
            name: '🚀 节点选择',
            type: 'select',
            proxies: finalUniqueProxies.map(p => p.name)
        },
        // 可以根据需要添加更多默认组，如 AUTO, DIRECT, REJECT 等
        {
            name: '♻️ 自动选择',
            type: 'url-test',
            proxies: finalUniqueProxies.map(p => p.name),
            url: 'http://www.gstatic.com/generate_204',
            interval: 300
        }
    ];
    // 可以根据需要添加更复杂的规则列表

    let mergedConfigYaml = YAML.stringify(baseConfig);
    let processedConfigYaml = mergedConfigYaml; // 默认处理后的配置等于合并后的

    // 5. 保存合并后的配置
    try {
        await fs.writeFile(OUTPUT_FILE, mergedConfigYaml);
        console.log(`合并后的配置已保存到: ${OUTPUT_FILE}`);
    } catch (err) {
        console.error(`保存合并配置文件 (${OUTPUT_FILE}) 失败:`, err.message);
    }

    try {
        // 注意：需要确保 clash-configs.js 能正确处理传入的 JS 对象
        const clashConfigProcessor = require('../clash-configs.js'); // 确保路径正确
        const processedConfigObject = clashConfigProcessor.main(baseConfig); // 传入对象而非 YAML 字符串
        processedConfigYaml = YAML.stringify(processedConfigObject);
        console.log('已使用 clash-configs.js 处理配置');
    } catch (err) {
        console.error('使用 clash-configs 处理时出错:', err.message);
        // 处理失败，processedConfigYaml 保持为原始合并后的 YAML
    }

    // 7. 保存处理后的配置
    try {
        await fs.writeFile(PROCESSED_OUTPUT_FILE, processedConfigYaml);
        console.log(`处理过的配置已保存到: ${PROCESSED_OUTPUT_FILE}`);
    } catch (err) {
        console.error(`保存处理后配置文件 (${PROCESSED_OUTPUT_FILE}) 失败:`, err.message);
    }

    // 8. 保存更新后的用户信息
    await writeUserInfoData(newUserInfo);

    console.log('配置处理流程完成。');
}

module.exports = {
    processConfigs,
    OUTPUT_FILE, // 仍然导出，可能其他地方需要
    PROCESSED_OUTPUT_FILE // 仍然导出
};