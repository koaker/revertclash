/**
 * 协议转换管理器
 * 用于管理不同协议的转换器，提供统一的接口进行协议转换
 */
const URL = require('url');
const YAML = require('yaml');

class ProtocolConverter {
  constructor() {
    this.converters = new Map();
  }

  /**
   * 注册一个协议转换器
   * @param {string} protocol - 协议名称
   * @param {object} converter - 协议转换器实例
   */
  registerConverter(protocol, converter) {
    this.converters.set(protocol, converter);
  }

  /**
   * 根据URI自动识别协议并转换为Clash配置
   * @param {string} uri - 协议URI
   * @returns {object|null} Clash代理配置对象或null
   */
  uriToClash(uri) {
    // 尝试识别协议
    const protocol = this._detectProtocol(uri);
    if (!protocol) {
      console.error('无法识别的协议URI:', uri);
      return null;
    }

    const converter = this.converters.get(protocol);
    if (!converter) {
      console.error('没有找到对应的协议转换器:', protocol);
      return null;
    }

    return converter.uriToClash(uri);
  }

  /**
   * 将多个URI转换为完整的Clash配置
   * @param {string[]} uris - 协议URI数组
   * @returns {object} 完整的Clash配置对象
   */
  urisToClashConfig(uris) {
    const proxies = [];
    
    for (const uri of uris) {
      const proxy = this.uriToClash(uri);
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

  /**
   * 将Clash配置转换为特定协议的URI
   * @param {object} clashConfig - Clash代理配置对象
   * @param {string} protocol - 目标协议
   * @returns {string|null} 协议URI或null
   */
  clashToUri(clashConfig, protocol) {
    const converter = this.converters.get(protocol);
    if (!converter || !converter.canHandleClash(clashConfig)) {
      console.error('无法将Clash配置转换为指定协议:', protocol);
      return null;
    }
    
    return converter.clashToUri(clashConfig);
  }

  /**
   * 将Clash配置中的所有代理转换为指定协议的URI列表
   * @param {object} clashConfig - 完整的Clash配置对象
   * @param {string} protocol - 目标协议
   * @returns {string[]} 协议URI数组
   */
  clashConfigToUris(clashConfig, protocol) {
    if (!clashConfig || !Array.isArray(clashConfig.proxies)) {
      console.error('无效的Clash配置格式');
      return [];
    }

    const converter = this.converters.get(protocol);
    if (!converter) {
      console.error('没有找到对应的协议转换器:', protocol);
      return [];
    }

    const uris = [];
    for (const proxy of clashConfig.proxies) {
      if (converter.canHandleClash(proxy)) {
        const uri = converter.clashToUri(proxy);
        if (uri) {
          uris.push(uri);
        }
      }
    }

    return uris;
  }

  /**
   * 将YAML格式的Clash配置字符串解析并转换为指定协议的URI列表
   * @param {string} yamlString - YAML格式的Clash配置
   * @param {string} protocol - 目标协议
   * @returns {string[]} 协议URI数组
   */
  clashYamlToUris(yamlString, protocol) {
    try {
      const config = YAML.parse(yamlString);
      return this.clashConfigToUris(config, protocol);
    } catch (err) {
      console.error('解析YAML配置失败:', err.message);
      return [];
    }
  }

  /**
   * 将多个URI转换为YAML格式的Clash配置
   * @param {string[]} uris - 协议URI数组
   * @returns {string} YAML格式的Clash配置
   */
  urisToClashYaml(uris) {
    const config = this.urisToClashConfig(uris);
    if (!config) {
      return '';
    }
    
    // 添加基本的Clash配置
    const fullConfig = {
      port: 7890,
      'socks-port': 7891,
      'allow-lan': true,
      mode: 'rule',
      'log-level': 'info',
      ...config,
      rules: ['MATCH,DIRECT']
    };
    
    return YAML.stringify(fullConfig);
  }

  /**
   * 检测URI的协议类型
   * @private
   * @param {string} uri - 协议URI
   * @returns {string|null} 协议名称或null
   */
  _detectProtocol(uri) {
    if (typeof uri !== 'string') {
      return null;
    }

    // 根据URI前缀识别协议
    if (uri.startsWith('ss://')) {
      return 'ss';
    } else if (uri.startsWith('vless://')) {
      return 'vless';
    } else if (uri.startsWith('hysteria2://')) {
      return 'hysteria2';
    }
    
    return null;
  }
}

module.exports = ProtocolConverter;
