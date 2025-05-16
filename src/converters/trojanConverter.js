/**
 * Trojan协议转换器
 * 用于Trojan协议与Clash配置之间的转换
 */
const BaseConverter = require('./baseConverter');
const URL = require('url');

class TrojanConverter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   * @param {string} uri - 要检查的URI
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('trojan://');
  }

  /**
   * 检查是否可以处理给定的Clash配置
   * @param {Object} clashConfig - 要检查的Clash配置
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'trojan';
  }

  /**
   * 将Trojan URI转换为Clash代理配置
   * @param {string} uri - Trojan URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  uriToClash(uri) {
    try {
      // Trojan URI格式: trojan://password@server:port?参数&参数#备注
      const url = new URL.URL(uri);
      
      // 从URL中提取密码（username部分）
      const password = decodeURIComponent(url.username);
      
      if (!password) {
        console.error('无效的Trojan URI格式 (缺少密码)');
        return null;
      }
      
      // 提取查询参数
      const params = new URLSearchParams(url.search);
      
      // 提取节点名称（从hash部分）
      let name = '';
      if (url.hash) {
        name = decodeURIComponent(url.hash.substring(1));
      }
      
      // 如果没有名称，使用服务器和端口作为名称
      if (!name) {
        name = `${url.hostname}:${url.port}`;
      }
      
      // 创建Clash配置对象
      const clashConfig = {
        name,
        type: 'trojan',
        server: url.hostname,
        port: parseInt(url.port, 10),
        password,
        'udp': params.get('udp') === '1' || params.get('udp') === 'true'
      };
      
      // 处理SNI参数
      const sni = params.get('sni') || params.get('peer');
      if (sni) {
        clashConfig.sni = sni;
      }
      
      // 处理allowInsecure参数（skip-cert-verify）
      const allowInsecure = params.get('allowInsecure');
      if (allowInsecure === '1' || allowInsecure === 'true') {
        clashConfig['skip-cert-verify'] = true;
      }
      
      return clashConfig;
    } catch (err) {
      console.error('解析Trojan URI失败:', err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为Trojan URI
   * @param {Object} clashConfig - Clash代理配置对象
   * @returns {string|null} - Trojan URI或null
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }
      
      const { name, server, port, password, sni } = clashConfig;
      
      if (!server || !port || !password) {
        console.error('缺少必要的Trojan配置参数');
        return null;
      }
      
      // 构建基础URI
      let uri = `trojan://${encodeURIComponent(password)}@${server}:${port}`;
      
      // 添加查询参数
      const params = [];
      
      // 添加skip-cert-verify参数
      if (clashConfig['skip-cert-verify'] === true) {
        params.push('allowInsecure=1');
      }
      
      // 添加udp参数
      if (clashConfig.udp === true) {
        params.push('udp=1');
      }
      
      // 添加sni参数
      if (sni) {
        params.push(`sni=${encodeURIComponent(sni)}`);
        params.push(`peer=${encodeURIComponent(sni)}`); // 兼容性考虑，添加peer参数
      }
      
      // 将参数添加到URI
      if (params.length > 0) {
        uri += '?' + params.join('&');
      }
      
      // 添加名称（如果有）
      if (name) {
        uri += `#${encodeURIComponent(name)}`;
      }
      
      return uri;
    } catch (err) {
      console.error('生成Trojan URI失败:', err.message);
      return null;
    }
  }
}

module.exports = TrojanConverter;
