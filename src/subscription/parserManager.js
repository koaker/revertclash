const YamlParser = require('./parsers/yamlParser');
const UriListParser = require('./parsers/uriListParser');
const Base64WrapperParser = require('./parsers/base64WrapperParser');

/**
 * 订阅解析器管理器
 * 负责注册和管理不同的解析器，并根据内容自动选择合适的解析器。
 */
class ParserManager {
    constructor() {
        this.parsers = [];
        this._initializeParsers();
    }

    /**
     * 初始化并注册所有解析器。
     * 注意注册顺序很重要，Base64WrapperParser 应该优先尝试，
     * 然后是特定格式（如 YAML），最后是通用格式（如 URI 列表）。
     */
    _initializeParsers() {
        // 内部解析器，用于 Base64 解码后尝试解析
        const innerParsers = [
            new YamlParser(),
            new UriListParser()
            // 未来可以添加更多内部解析器，例如 V2RayN JSON 格式等
        ];

        // 注册解析器，注意顺序
        this.registerParser(new Base64WrapperParser(innerParsers)); // 优先尝试 Base64
        this.registerParser(new YamlParser());                     // 然后尝试 YAML
        this.registerParser(new UriListParser());                  // 最后尝试 URI 列表
        // 未来可以添加更多解析器，例如直接处理 V2RayN JSON 格式等
    }

    /**
     * 注册一个新的解析器实例。
     * @param {BaseParser} parser - 继承自 BaseParser 的解析器实例。
     */
    registerParser(parser) {
        if (parser && typeof parser.canParse === 'function' && typeof parser.parse === 'function') {
            this.parsers.push(parser);
        } else {
            console.error('注册解析器失败：实例无效或未实现必要方法');
        }
    }

    /**
     * 根据订阅内容自动选择合适的解析器进行解析。
     * @param {string} content - 原始订阅内容字符串。
     * @returns {Promise<object[]|null>} - 返回 Clash 代理配置对象数组或 null。
     */
    async parse(content) {
        if (!content || typeof content !== 'string') {
            console.warn('ParserManager: 无效的输入内容');
            return null;
        }

        const trimmedContent = content.trim();
        if (!trimmedContent) {
            console.warn('ParserManager: 输入内容为空');
            return null;
        }

        for (const parser of this.parsers) {
            try {
                if (parser.canParse(trimmedContent)) {
                    // console.log(`ParserManager: 使用解析器 ${parser.constructor.name}`); // 调试信息
                    const result = await parser.parse(trimmedContent);
                    if (result) {
                        // console.log(`ParserManager: 解析成功，节点数: ${result.length}`); // 调试信息
                        return result; // 返回第一个成功解析的结果
                    }
                    // 如果 canParse 为 true 但 parse 返回 null，继续尝试下一个解析器
                    // console.log(`ParserManager: 解析器 ${parser.constructor.name} 未能成功解析`); // 调试信息
                }
            } catch (err) {
                console.error(`ParserManager: 解析器 ${parser.constructor.name} 抛出异常:`, err);
                // 即使一个解析器失败，也继续尝试下一个
            }
        }

        console.error('ParserManager: 没有找到合适的解析器或所有解析器都失败了');
        return null; // 所有解析器都无法处理
    }
}

// 导出一个单例，方便在项目中使用
module.exports = new ParserManager();