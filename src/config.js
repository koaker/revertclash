const fs = require('fs').promises;
const YAML = require('yaml');
const axios = require('axios');
const path = require('path');
const URL = require('url');

// 配置文件路径
const CONFIG_FILE = path.join(__dirname, '..', 'clash-urls.txt');
const CONFIGS_DIR = path.join(__dirname, '..', 'configs');
const CONFIG_SETTINGS_FILE = path.join(__dirname, '..', 'config-settings.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'merged-config.yaml');
const PROCESSED_OUTPUT_FILE = path.join(__dirname, '..', 'processed-merged-config.yaml');

// Clash Verge的请求头
const CLASH_HEADERS = {
    'User-Agent': 'Clash Verge',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br'
};

async function readUrls() {
    try {
        const content = await fs.readFile(CONFIG_FILE, 'utf8');
        const urls = [];
        
        content.split('\n').forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            
            // 检查是否包含名称前缀（格式：名称=URL）
            const firstEqualIndex = line.indexOf('=');
            if (firstEqualIndex > 0) {
                const name = line.substring(0, firstEqualIndex).trim();
                const url = line.substring(firstEqualIndex + 1).trim();
                if (url) {
                    urls.push({ name, url });
                }
            } else {
                // 如果没有指定名称，使用默认前缀
                urls.push({
                    name: '节点',
                    url: line
                });
            }
        });
        
        return urls;
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(CONFIG_FILE, '# 在此文件中添加Clash配置URL，每行一个\n');
            console.log('已创建空的URL配置文件');
        } else {
            console.error('读取配置URL文件失败:', err.message);
        }
        return [];
    }
}

function isBase64(str) {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
        return false;
    }
}

function parseSSURI(uri) {
    try {
        const url = new URL.URL(uri);
        const [method, password] = Buffer.from(url.username, 'base64')
            .toString()
            .split(':');
        
        // 提取节点名称
        const name = decodeURIComponent(url.hash.substring(1));
        
        return {
            name: name || `${url.hostname}:${url.port}`,
            type: 'ss',
            server: url.hostname,
            port: parseInt(url.port),
            cipher: method,
            password: password
        };
    } catch (err) {
        console.error('解析SS URI失败:', err.message);
        return null;
    }
}

function parseVlessURI(uri) {
    try {
        const url = new URL.URL(uri);
        const params = url.searchParams;
        
        // 提取节点名称
        const name = decodeURIComponent(url.hash.substring(1));
        
        return {
            name: name || `${url.hostname}:${url.port}`,
            type: 'vless',
            server: url.hostname,
            port: parseInt(url.port),
            uuid: url.username,
            network: params.get('type') || 'tcp',
            tls: params.get('security') === 'tls' || params.get('security') === 'reality',
            reality: params.get('security') === 'reality' ? {
                public_key: params.get('pbk'),
                short_id: params.get('sid')
            } : undefined,
            flow: params.get('flow'),
            'skip-cert-verify': true
        };
    } catch (err) {
        console.error('解析Vless URI失败:', err.message);
        return null;
    }
}

function parseProxyURI(uri) {
    if (uri.startsWith('ss://')) {
        return parseSSURI(uri);
    } else if (uri.startsWith('vless://')) {
        return parseVlessURI(uri);
    }
    return null;
}

function convertURIsToClashConfig(uris) {
    const proxies = [];
    
    for (const uri of uris.split('\n')) {
        const trimmedUri = uri.trim();
        if (!trimmedUri || trimmedUri.startsWith('#')) continue;
        
        const proxy = parseProxyURI(trimmedUri);
        if (proxy) {
            proxies.push(proxy);
        }
    }
    
    if (proxies.length === 0) {
        return null;
    }
    
    return {
        proxies,
        'proxy-groups': [{
            name: '🚀 节点选择',
            type: 'select',
            proxies: proxies.map(p => p.name)
        }]
    };
}

// 新增的 parseUserInfo 函数
function parseUserInfo(userInfoString) {
    if (!userInfoString) return null;
    const info = {};
    userInfoString.split(';').forEach(pair => {
        const parts = pair.split('=');
        if (parts.length === 2) {
            const key = parts[0].trim();
            const value = parseInt(parts[1].trim(), 10);
            if (!isNaN(value)) {
                info[key] = value;
            }
        }
    });
    // 确保包含必要的字段，即使值为0
    const requiredKeys = ['upload', 'download', 'total', 'expire'];
    requiredKeys.forEach(key => {
        if (!(key in info)) {
            // 如果缺少关键信息，可能认为解析无效或提供默认值
            // 这里我们选择返回null表示信息不完整或无效
            // return null; // 或者可以设置默认值 info[key] = 0;
        }
    });
     // 检查是否有至少一个有效字段被解析出来
    if (Object.keys(info).length === 0) {
        return null;
    }
    return info;
}

async function downloadConfig(url, prefix) {
    let userInfo = null; // 初始化 userInfo
    try {
        // 使用 axios 获取完整响应
        const response = await axios.get(url, {
            headers: CLASH_HEADERS,
            timeout: 10000, // 10秒超时
            responseType: 'text' // 获取原始文本数据
        });

        // 尝试解析 UserInfo
        const userInfoHeader = response.headers['subscription-userinfo'];
        if (userInfoHeader) {
            userInfo = parseUserInfo(userInfoHeader);
            if (userInfo) {
                 console.log(`成功解析 ${prefix} 的用户信息:`, userInfo);
            } else {
                 console.log(`未能完整解析 ${prefix} 的用户信息头: ${userInfoHeader}`);
            }
        } else {
             console.log(`订阅 ${prefix} 未提供 Subscription-Userinfo 头`);
        }


        let configData = response.data; // 现在 data 是文本
        let config = null;

        // 如果返回的是字符串，检查是否是Base64编码
        if (typeof configData === 'string') {
            // 尝试检测并解码Base64内容
            if (isBase64(configData)) {
                const decodedConfig = Buffer.from(configData, 'base64').toString('utf8');

                // 尝试将URI格式转换为Clash配置
                const uriConfig = convertURIsToClashConfig(decodedConfig);
                if (uriConfig) {
                    console.log(`成功将 ${prefix} 的 Base64 URI 格式转换为 Clash 配置`);
                    config = uriConfig;
                } else {
                    // 如果不是URI格式，尝试解析为YAML
                    try {
                        config = YAML.parse(decodedConfig);
                        console.log(`成功解码并解析 ${prefix} 的 Base64 YAML 配置`);
                    } catch (err) {
                        console.error(`解析 ${prefix} 的 Base64 YAML 配置失败:`, err.message);
                        // 返回 null config 和 userInfo
                        return { config: null, userInfo };
                    }
                }
            } else {
                // 检查是否是URI格式
                const uriConfig = convertURIsToClashConfig(configData);
                if (uriConfig) {
                     console.log(`成功将 ${prefix} 的 URI 格式转换为 Clash 配置`);
                    config = uriConfig;
                } else {
                    // 尝试解析为YAML
                    try {
                        config = YAML.parse(configData);
                         console.log(`成功解析 ${prefix} 的 YAML 配置`);
                    } catch (err) {
                        console.error(`解析 ${prefix} 的 YAML 配置失败:`, err.message);
                         // 返回 null config 和 userInfo
                        return { config: null, userInfo };
                    }
                }
            }
        } else {
             // 如果 axios 返回的不是字符串（理论上 responseType: 'text' 后不会）
             console.error(`下载 ${prefix} 的响应不是文本格式:`, typeof configData);
             return { config: null, userInfo };
        }


        // 验证配置格式
        if (!config || !Array.isArray(config.proxies)) {
            console.error(`无效的Clash配置格式: ${url} (前缀: ${prefix})`);
            // 即使配置无效，也可能包含有效的用户信息
            return { config: null, userInfo };
        }

        // 添加节点前缀
        if (prefix) {
            config.proxies = config.proxies.map(proxy => ({
                ...proxy,
                name: `${prefix}|-|${proxy.name}`
            }));
        }

        // 只保留proxies，去除其他配置
        return {
            config: { proxies: config.proxies },
            userInfo // 返回解析出的用户信息
        };
    } catch (err) {
        console.error(`下载或处理配置失败 ${url} (前缀: ${prefix}):`, err.message);
        // 下载失败也返回 null config 和 userInfo
        return { config: null, userInfo: null };
    }
}

async function mergeConfigs(configs) {
    if (!configs || configs.length === 0) {
        throw new Error('没有有效的配置可供合并');
    }

    // 过滤掉无效的配置
    const validConfigs = configs.filter(config => 
        config && Array.isArray(config.proxies) && config.proxies.length > 0
    );

    if (validConfigs.length === 0) {
        throw new Error('没有包含代理节点的有效配置');
    }

    console.log(`找到 ${validConfigs.length} 个有效配置`);

    // 收集所有代理
    const allProxies = validConfigs.reduce((acc, config) => {
        if (Array.isArray(config.proxies)) {
            acc.push(...config.proxies);
        }
        return acc;
    }, []);

    // 删除重复的代理
    const uniqueProxies = Array.from(
        new Map(allProxies.map(proxy => [proxy.name, proxy])).values()
    );

    console.log(`合并了 ${uniqueProxies.length} 个代理节点`);

    // 创建全新的基础配置
    const mergedConfig = {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': true,
        mode: 'rule',
        'log-level': 'info',
        proxies: uniqueProxies,
        'proxy-groups': [
            {
                name: '🚀 节点选择',
                type: 'select',
                proxies: uniqueProxies.map(proxy => proxy.name)
            }
        ],
        rules: ['MATCH,DIRECT']  // 使用最简单的规则
    };

    return mergedConfig;
}

async function readLocalConfigs() {
    try {
        const files = await fs.readdir(CONFIGS_DIR);
        const configs = [];
        
        for (const file of files) {
            if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                try {
                    const filePath = path.join(CONFIGS_DIR, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const config = YAML.parse(content);
                    
                    if (config && Array.isArray(config.proxies)) {
                        console.log(`成功读取本地配置: ${file}`);
                        // 为每个代理添加文件名前缀
                        const fileName = file.replace(/\.(yaml|yml)$/, '');
                        config.proxies = config.proxies.map(proxy => ({
                            ...proxy,
                            name: `${fileName}|-|${proxy.name}`
                        }));
                        configs.push(config);
                    }
                } catch (err) {
                    console.error(`读取本地配置失败 ${file}:`, err.message);
                }
            }
        }
        
        return configs;
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('configs目录为空');
        } else {
            console.error('读取本地配置目录失败:', err.message);
        }
        return [];
    }
}

// 读取配置设置
async function readConfigSettings() {
    try {
        const content = await fs.readFile(CONFIG_SETTINGS_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // 创建默认配置
            const defaultSettings = {
                useClashConfig: false // 默认不使用clash-configs.js处理
            };
            await fs.writeFile(CONFIG_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }
        console.error('读取配置设置失败:', err.message);
        return { useClashConfig: false };
    }
}

async function processConfigs() {
    console.log('开始处理配置...');

    const configs = [];
    const allUserInfo = {}; // 初始化用于存储所有用户信息的对象
    const userInfoFilePath = path.join(__dirname, '..', 'url-userinfo.json'); // 定义用户信息文件路径

    // 读取本地配置文件
    const localConfigs = await readLocalConfigs();
    // 注意：readLocalConfigs 返回的是包含 proxies 的对象数组
    configs.push(...localConfigs.map(c => ({ proxies: c.proxies }))); // 确保只传递配置对象

    // 读取URL订阅
    const urls = await readUrls();
    if (urls.length > 0) {
        console.log(`发现 ${urls.length} 个配置URL`);

        for (const { url, name } of urls) {
            console.log(`正在下载配置: ${url} (前缀: ${name})`);
            // downloadConfig 现在返回 { config, userInfo }
            const result = await downloadConfig(url, name);
            if (result.config && result.config.proxies && result.config.proxies.length > 0) { // 检查配置和proxies是否有效
                configs.push(result.config);
            } else {
                console.log(`下载的配置 ${name} 无有效代理节点，已跳过。`);
            }
            if (result.userInfo) { // 检查用户信息是否有效
                allUserInfo[name] = result.userInfo; // 使用订阅名称作为键存储用户信息
            }
        }
    } else {
        console.log('没有找到有效的配置URL');
    }

    try {
        // mergeConfigs 只接收配置对象数组
        const mergedConfig = await mergeConfigs(configs);

        // 读取配置设置
        const settings = await readConfigSettings();

        let finalConfig = mergedConfig;

        // 保存最终配置 (merged-config.yaml) - 保存合并后的原始配置
        await fs.writeFile(OUTPUT_FILE, YAML.stringify(mergedConfig)); // 保存未经处理的合并配置
        console.log(`合并后的配置已保存到: ${OUTPUT_FILE}`);

        // 如果启用了clash-configs处理
        if (settings.useClashConfig) {
            try {
                const clashConfigProcessor = require('../clash-configs.js'); // 确保路径正确
                finalConfig = clashConfigProcessor.main(mergedConfig); // 使用合并后的配置进行处理
                console.log('已使用 clash-configs.js 处理配置');
            } catch (err) {
                console.error('使用 clash-configs 处理时出错:', err.message);
                // 如果处理失败,使用原始合并配置
                finalConfig = mergedConfig;
            }
        } else {
             // 如果不使用 clash-configs 处理，最终配置就是合并后的配置
             finalConfig = mergedConfig;
        }

        // 保存处理后的配置 (processed-merged-config.yaml)
        await fs.writeFile(PROCESSED_OUTPUT_FILE, YAML.stringify(finalConfig));
        console.log(`处理过的配置已保存到: ${PROCESSED_OUTPUT_FILE}`);
        console.log(`成功处理了 ${finalConfig.proxies ? finalConfig.proxies.length : 0} 个代理节点`);

        // 在所有处理完成后，写入用户信息文件
        try {
            await fs.writeFile(userInfoFilePath, JSON.stringify(allUserInfo, null, 2));
            console.log(`用户信息已保存到: ${userInfoFilePath}`);
        } catch (writeErr) {
            console.error('写入用户信息文件失败:', writeErr.message);
        }

    } catch (err) {
        // 捕获 mergeConfigs 可能抛出的错误
        console.error('处理或合并配置失败:', err.message);
        // 即使合并失败，也尝试保存已获取的用户信息
        try {
            if (Object.keys(allUserInfo).length > 0) {
                await fs.writeFile(userInfoFilePath, JSON.stringify(allUserInfo, null, 2));
                console.log(`用户信息已保存到: ${userInfoFilePath} (配置合并失败)`);
            }
        } catch (writeErr) {
            console.error('写入用户信息文件失败 (配置合并失败后):', writeErr.message);
        }
    }
}

module.exports = {
    processConfigs,
    OUTPUT_FILE,
    PROCESSED_OUTPUT_FILE
};