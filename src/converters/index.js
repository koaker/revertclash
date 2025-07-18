/**
 * 协议转换模块入口
 * 注册所有支持的协议转换器并提供统一的接口
 */
const ProtocolConverter = require('./protocolConverter');
const SSConverter = require('./ssConverter');
const VlessConverter = require('./vlessConverter');
const Hysteria2Converter = require('./hysteria2Converter');
const VMessConverter = require('./vmessConverter');
const TrojanConverter = require('./trojanConverter');
const S5Converter = require('./s5Converter');
// 创建协议转换管理器实例
const protocolConverter = new ProtocolConverter();

// 注册所有支持的协议转换器
protocolConverter.registerConverter('ss', new SSConverter());
protocolConverter.registerConverter('vless', new VlessConverter());
protocolConverter.registerConverter('hysteria2', new Hysteria2Converter());
protocolConverter.registerConverter('vmess', new VMessConverter());
protocolConverter.registerConverter('trojan', new TrojanConverter());
protocolConverter.registerConverter('socks', new S5Converter());

/**
 * 将URI转换为Clash配置
 * @param {string} uri - 协议URI
 * @returns {object|null} - Clash代理配置对象或null
 */
function uriToClash(uri) {
  return protocolConverter.uriToClash(uri);
}

/**
 * 将多个URI转换为完整的Clash配置
 * @param {string[]} uris - 协议URI数组
 * @returns {object|null} - 完整的Clash配置对象或null
 */
function urisToClashConfig(uris) {
  return protocolConverter.urisToClashConfig(uris);
}

/**
 * 将多个URI转换为YAML格式的Clash配置
 * @param {string[]} uris - 协议URI数组
 * @returns {string} - YAML格式的Clash配置
 */
function urisToClashYaml(uris) {
  return protocolConverter.urisToClashYaml(uris);
}

/**
 * 将Clash配置转换为特定协议的URI
 * @param {object} clashConfig - Clash代理配置对象
 * @param {string} protocol - 目标协议
 * @returns {string|null} - 协议URI或null
 */
function clashToUri(clashConfig, protocol) {
  return protocolConverter.clashToUri(clashConfig, protocol);
}

/**
 * 将Clash配置中的所有代理转换为指定协议的URI列表
 * @param {object} clashConfig - 完整的Clash配置对象
 * @param {string} protocol - 目标协议
 * @returns {string[]} - 协议URI数组
 */
function clashConfigToUris(clashConfig, protocol) {
  return protocolConverter.clashConfigToUris(clashConfig, protocol);
}

/**
 * 将YAML格式的Clash配置字符串解析并转换为指定协议的URI列表
 * @param {string} yamlString - YAML格式的Clash配置
 * @param {string} protocol - 目标协议
 * @returns {string[]} - 协议URI数组
 */
function clashYamlToUris(yamlString, protocol) {
  return protocolConverter.clashYamlToUris(yamlString, protocol);
}

/**
 * 获取所有支持的协议列表
 * @returns {string[]} - 支持的协议列表
 */
function getSupportedProtocols() {
  return Array.from(protocolConverter.converters.keys());
}

/**
 * 检测URI的协议类型
 * @param {string} uri - 协议URI
 * @returns {string|null} - 协议名称或null
 */
function detectProtocol(uri) {
  return protocolConverter._detectProtocol(uri);
}

// 导出所有公共方法
module.exports = {
  uriToClash,
  urisToClashConfig,
  urisToClashYaml,
  clashToUri,
  clashConfigToUris,
  clashYamlToUris,
  getSupportedProtocols,
  detectProtocol,
  // 导出转换器实例，以便用户可以直接访问
  converter: protocolConverter
};
