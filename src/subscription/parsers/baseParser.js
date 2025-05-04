/**
 * 基础订阅解析器类 (接口定义)
 * 所有具体的解析器都应继承此类并实现其方法。
 */
class BaseParser {
    /**
     * 判断此解析器是否能处理给定的订阅内容。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {boolean} - 如果可以处理则返回 true，否则返回 false。
     */
    canParse(content) {
        throw new Error("子类必须实现 'canParse' 方法");
    }

    /**
     * 解析订阅内容，提取 Clash 代理节点。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {Promise<object[]|null>} - 返回包含 Clash 代理配置对象的数组，如果解析失败则返回 null。
     *                                     每个对象应符合 Clash proxy 定义。
     */
    async parse(content) {
        throw new Error("子类必须实现 'parse' 方法");
    }
}

module.exports = BaseParser;