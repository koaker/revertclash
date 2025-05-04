const BaseParser = require('./baseParser');

/**
 * Base64 包装解析器
 * 尝试对内容进行 Base64 解码，然后将解码后的内容传递给内部解析器。
 */
class Base64WrapperParser extends BaseParser {
    /**
     * 构造函数
     * @param {BaseParser[]} innerParsers - 用于解析解码后内容的解析器实例数组
     */
    constructor(innerParsers) {
        super();
        if (!Array.isArray(innerParsers) || innerParsers.length === 0) {
            throw new Error("Base64WrapperParser 需要至少一个内部解析器");
        }
        this.innerParsers = innerParsers;
    }

    /**
     * 判断是否可能是 Base64 编码的内容。
     * 简单判断：只包含 Base64 字符，且长度较长。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {boolean}
     */
    canParse(content) {
        const trimmedContent = content.trim();
        // 简单判断：只包含 Base64 字符且长度大于某个阈值（例如 50）
        // 并且不是一个有效的 URL (避免误判包含 Base64 的 URL)
        const isBase64Chars = /^[A-Za-z0-9+/=\s]+$/.test(trimmedContent);
        const isLongEnough = trimmedContent.length > 50;
        let isUrl = false;
        try {
            new URL(trimmedContent);
            isUrl = true;
        } catch (_) {
            // 不是有效的 URL
        }
        return isBase64Chars && isLongEnough && !isUrl;
    }

    /**
     * 尝试 Base64 解码，并使用内部解析器解析。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {Promise<object[]|null>} - 返回 Clash 代理配置对象数组或 null。
     */
    async parse(content) {
        try {
            const decodedContent = Buffer.from(content.trim(), 'base64').toString('utf8');
            // console.log("Base64 解码成功，尝试使用内部解析器..."); // 调试信息

            // 依次尝试使用内部解析器
            for (const parser of this.innerParsers) {
                if (parser.canParse(decodedContent)) {
                    // console.log(`使用内部解析器: ${parser.constructor.name}`); // 调试信息
                    const result = await parser.parse(decodedContent);
                    if (result) {
                        return result; // 返回第一个成功解析的结果
                    }
                }
            }
            // 如果所有内部解析器都无法解析解码后的内容
            console.warn('Base64WrapperParser: 解码后的内容无法被任何内部解析器处理');
            return null;
        } catch (err) {
            // Base64 解码失败或内部解析器抛出异常
            // console.error('Base64WrapperParser: 解码或内部解析失败 - ', err.message); // 调试信息
            return null;
        }
    }
}

module.exports = Base64WrapperParser;