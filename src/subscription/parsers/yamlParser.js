const YAML = require('yaml');
const BaseParser = require('./baseParser');

/**
 * Clash YAML 格式订阅解析器
 */
class YamlParser extends BaseParser {
    /**
     * 判断是否可能是 YAML 格式。
     * 简单判断：包含 'proxies:' 关键字，并且不是明显的 Base64 或 URI 列表。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {boolean}
     */
    canParse(content) {
        const trimmedContent = content.trim();
        // 排除明显的 Base64 (只包含 Base64 字符) 和 URI 列表 (以协议头开头)
        const isLikelyBase64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmedContent) && trimmedContent.length > 50; // 简单判断
        const isLikelyUriList = /^(ss|vmess|vless|trojan|hysteria2?):\/\//.test(trimmedContent);

        return trimmedContent.includes('proxies:') && !isLikelyBase64 && !isLikelyUriList;
    }

    /**
     * 解析 YAML 格式内容。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {Promise<object[]|null>} - 返回 Clash 代理配置对象数组或 null。
     */
    async parse(content) {
        try {
            const config = YAML.parse(content);
            if (config && Array.isArray(config.proxies) && config.proxies.length > 0) {
                // 验证每个 proxy 对象是否基本符合要求 (至少有 name, type, server, port)
                const validProxies = config.proxies.filter(p =>
                    p && typeof p === 'object' && p.name && p.type && p.server && p.port
                );
                if (validProxies.length > 0) {
                    console.log(`YAML 解析器: 成功解析 ${validProxies.length} 个节点`);
                    return validProxies;
                } else {
                    console.warn('YAML 解析器: proxies 数组为空或节点格式无效');
                    return null;
                }
            } else {
                console.warn('YAML 解析器: 未找到有效的 proxies 数组');
                return null;
            }
        } catch (err) {
            // 如果 YAML 解析失败，说明不是有效的 YAML，返回 null
            // console.error('YAML 解析器: 解析失败 - ', err.message); // 调试时可以取消注释
            return null;
        }
    }
}

module.exports = YamlParser;