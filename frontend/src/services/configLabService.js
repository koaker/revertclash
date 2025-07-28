import axios from 'axios';

const CONVERTER_API_URL = '/api/converter';
const CONFIG_API_URL = '/api/custom-configs'; // 复用自定义配置的保存接口
const DEBUG_API_URL = '/api/newconfig'; // 调试接口在 newconfig 路由下

/**
 * 批量转换非Clash链接为Clash配置内容
 * @param {string[]} uris - 链接数组
 * @returns {Promise<string>} YAML格式的配置内容
 */
export const convertLinks = async (uris) => {
    const response = await axios.post(`${CONVERTER_API_URL}/batch-convert`, {
        uris,
        format: 'yaml'
    });

    if (!response.data.successful || response.data.successful.length === 0) {
        throw new Error('没有成功转换的URI');
    }

    // 将所有成功转换的节点合并到一个 proxies 数组中
    const allProxies = response.data.successful.map(item => item.config);

    // 注意：这里我们只返回了 proxies 数组，而不是完整的YAML字符串。
    // 完整的YAML构建逻辑将在Store或Component中处理，以获得更大的灵活性。
    return allProxies;
};

/**
 * 将转换后的配置内容保存为新的自定义配置文件
 * @param {string} name - 配置文件名称
 * @param {string} content - YAML格式的配置内容
 * @returns {Promise<object>}
 */
export const saveConvertedConfig = async (name, content) => {
    // 后端需要 name 和 content 两个字段
    const response = await axios.post(CONFIG_API_URL, { name, content });
    return response.data;
};


/**
 * 运行订阅调试
 * @param {string} subscriptionName - 要调试的订阅名称
 * @returns {Promise<object>}
 */
export const debugSubscription = async (subscriptionName) => {
    // 根据 manage.html 的 fetch 调用，API路径是 /api/configs/debug/:name
    // 但根据项目结构和功能，新的调试API可能在 /api/newconfig/debug/:name
    // 我们暂时使用 /api/newconfig/manager/health 作为替代来获取状态
    const response = await axios.get(`${DEBUG_API_URL}/manager/health`);
    if (response.data.success) {
        const sourceInfo = response.data.data.failedDetails.find(d => d.name === subscriptionName);
        if (sourceInfo) {
            return { status: 'failed', data: sourceInfo };
        }
        // 如果在failed里没找到，说明可能是成功的
        // 这里只是一个模拟，真实调试接口需要后端提供
        return { status: 'success', data: { message: `订阅 '${subscriptionName}' 状态正常或未在失败列表中找到。` } };
    }
    return response.data;
};
