const fs = require('fs').promises;
const path = require('path');

const USER_INFO_FILE = path.join(__dirname, '..', '..', 'url-userinfo.json'); // 用户信息文件路径

/**
 * 解析 Subscription-Userinfo 字符串
 * @param {string} userInfoString - 原始字符串，例如 "upload=123; download=456; total=1024; expire=1678886400"
 * @returns {object|null} - 包含 upload, download, total, expire 的对象，或 null
 */
function parseUserInfoHeader(userInfoString) {
    if (!userInfoString || typeof userInfoString !== 'string') return null;
    const info = {};
    userInfoString.split(';').forEach(pair => {
        const parts = pair.split('=');
        if (parts.length === 2) {
            const key = parts[0].trim().toLowerCase(); // 统一转小写处理
            const value = parseInt(parts[1].trim(), 10);
            // 只存储需要的字段，并确保是数字
            if (['upload', 'download', 'total', 'expire'].includes(key) && !isNaN(value)) {
                info[key] = value;
            }
        }
    });

    // 简单验证是否包含必要信息 (可以根据需要调整)
    // if (!('upload' in info && 'download' in info && 'total' in info)) {
    //     console.warn("解析的用户信息不完整:", info);
    //     // return null; // 如果要求信息必须完整
    // }

    // 检查是否有至少一个有效字段被解析出来
    if (Object.keys(info).length === 0) {
        return null;
    }
    return info;
}

/**
 * 读取存储的用户信息文件
 * @returns {Promise<object>} - 返回包含所有用户信息的对象，键为订阅名称，值为用户信息对象。如果文件不存在或读取失败，返回空对象。
 */
async function readUserInfoData() {
    try {
        const content = await fs.readFile(USER_INFO_FILE, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        if (err.code === 'ENOENT') {
            // 文件不存在是正常情况
            return {};
        } else {
            console.error('读取用户信息文件失败:', err.message);
            return {}; // 读取或解析失败也返回空对象，避免阻塞主流程
        }
    }
}

/**
 * 将用户信息数据写入文件
 * @param {object} userInfoData - 包含所有用户信息的对象
 * @returns {Promise<void>}
 */
async function writeUserInfoData(userInfoData) {
    try {
        await fs.writeFile(USER_INFO_FILE, JSON.stringify(userInfoData, null, 2));
        console.log(`用户信息已保存到: ${USER_INFO_FILE}`);
    } catch (err) {
        console.error('写入用户信息文件失败:', err.message);
    }
}

module.exports = {
    parseUserInfoHeader,
    readUserInfoData,
    writeUserInfoData
};