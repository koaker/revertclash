const BaseParser = require('./baseParser');
// 引入现有的转换器逻辑
const { uriToClash, detectProtocol } = require('../../converters'); // 确保路径正确

/**
 * URI 列表格式订阅解析器
 * 处理每行一个协议链接 (如 ss://, vless://) 的格式。
 */
class UriListParser extends BaseParser {
    /**
     * 判断是否可能是 URI 列表格式。
     * 检查第一行是否以已知协议开头，并且内容不像 YAML 或纯 Base64。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {boolean}
     */
    canParse(content) {
        const trimmedContent = content.trim();
        if (!trimmedContent) return false;

        // 检查是否包含 YAML 关键字
        if (trimmedContent.includes('proxies:')) {
            return false;
        }

        // 检查是否可能是 Base64
        const isLikelyBase64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmedContent) && trimmedContent.length > 50;
        if (isLikelyBase64) {
            // 尝试解码看是否是纯文本URI列表，防止误判包含URI的Base64 YAML
            try {
                const decoded = Buffer.from(trimmedContent, 'base64').toString('utf8').trim();
                if (decoded.includes('proxies:')) return false; // 解码后是YAML，则不由本解析器处理
            } catch (e) {
                // 解码失败，可能不是Base64，继续判断
            }
        }


        // 获取第一行非空非注释行
        const firstLine = trimmedContent.split('\n').find(line => line.trim() && !line.trim().startsWith('#'));

        if (!firstLine) return false; // 没有有效行

        // 使用 detectProtocol 检查第一行是否是支持的 URI 协议
        return !!detectProtocol(firstLine.trim());
    }

    /**
     * 解析 URI 列表内容。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {Promise<object[]|null>} - 返回 Clash 代理配置对象数组或 null。
     */
    async parse(content) {
        const proxies = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue; // 跳过空行和注释
            }

            try {
                // 使用 src/converters 中的 uriToClash 进行转换
                const clashProxy = uriToClash(trimmedLine);
                if (clashProxy) {
                    proxies.push(clashProxy);
                } else {
                    console.warn(`URI List 解析器: 无法转换 URI: ${trimmedLine.substring(0, 30)}...`);
                }
            } catch (err) {
                console.error(`URI List 解析器: 转换 URI 时出错 (${trimmedLine.substring(0, 30)}...):`, err.message);
            }
        }

        if (proxies.length > 0) {
            console.log(`URI List 解析器: 成功解析 ${proxies.length} 个节点`);
            return proxies;
        } else {
            console.warn('URI List 解析器: 未找到有效的 URI 或无法转换');
            return null;
        }
    }
}

module.exports = UriListParser;