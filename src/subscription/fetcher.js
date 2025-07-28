const axios = require('axios');

// Clash Verge 的请求头，可以考虑将其移到配置中心
const CLASH_HEADERS = {
    'User-Agent': 'Clash Verge',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br'
};

/**
 * 下载订阅链接内容
 * @param {string} url - 订阅链接 URL
 * @param {number} timeout - 请求超时时间 (毫秒)
 * @returns {Promise<{content: string|null, headers: object|null, error: Error|null}>}
 *          返回包含原始内容、响应头和错误的 Promise 对象
 */
async function fetchSubscription(url, timeout = 15000, agent = null) {
    try {

        const axiosConfig = {
            headers: CLASH_HEADERS,
            timeout: timeout,
            responseType: 'text', // 确保获取原始文本
            validateStatus: function (status) {
                return status >= 200 && status < 500; // 处理 2xx 和部分客户端/服务器错误
            },
        };

        if (agent) {
            axiosConfig.httpsAgent = agent; // 如果提供了代理，则使用它
            axiosConfig.httpAgent = agent; // 同样适用于 HTTP 请求
        }
        const response = await axios.get(url, axiosConfig);

        if (response.status >= 200 && response.status < 300) {
            return {
                content: response.data,
                headers: response.headers,
                error: null
            };
        } else {
            // 对于非成功状态码，记录错误但仍可能返回响应头（如果有）
            const error = new Error(`请求失败，状态码: ${response.status}`);
            console.error(`下载 ${url} 失败: ${error.message}`);
            return {
                content: null,
                headers: response.headers, // 即使失败也尝试返回头信息
                error: error
            };
        }
    } catch (err) {
        console.error(`下载 ${url} 时发生网络错误:`, err.message);
        return {
            content: null,
            headers: null,
            error: err
        };
    }
}

module.exports = {
    fetchSubscription
};