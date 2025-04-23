/**
 * Hysteria2协议转换器
 * 用于Hysteria2协议与Clash配置之间的转换
 */
const BaseConverter = require('./baseConverter');
const URL = require('url');

class Hysteria2Converter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   * @param {string} uri - 要检查的URI
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('hysteria2://');
  }

  /**
   * 检查是否可以处理给定的Clash配置
   * @param {Object} clashConfig - 要检查的Clash配置
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'hysteria2';
  }

  /**
   * 将Hysteria2 URI转换为Clash代理配置
   * @param {string} uri - Hysteria2 URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  uriToClash(uri) {
    try {
      // Hysteria2 URI格式: hysteria2://auth@server:port?参数&参数#name
      const url = new URL.URL(uri);
      const params = url.searchParams;
      
      // 提取节点名称（从hash部分）
      let name = '';
      if (url.hash) {
        name = decodeURIComponent(url.hash.substring(1));
      }
      
      // 如果没有名称，使用服务器和端口作为名称
      if (!name) {
        name = `${url.hostname}:${url.port}`;
      }
      
      // 创建基本的Clash配置对象
      const clashConfig = {
        name,
        type: 'hysteria2',
        server: url.hostname,
        port: parseInt(url.port, 10),
        password: url.username, // Hysteria2使用username作为认证密码
        // 默认值
        udp: true,
        'skip-cert-verify': params.has('insecure') && params.get('insecure') === '1'
      };
      
      // 处理各种参数
      // ALPN
      if (params.has('alpn')) {
        clashConfig.alpn = [params.get('alpn')];
      }
      
      // 上行带宽
      if (params.has('upmbps')) {
        clashConfig.up = params.get('upmbps');
      }
      
      // 下行带宽
      if (params.has('downmbps')) {
        clashConfig.down = params.get('downmbps');
      }
      
      // 混淆密码
      if (params.has('obfs')) {
        clashConfig.obfs = params.get('obfs');
      }
      
      // 混淆密码（兼容旧版）
      if (params.has('obfs-password')) {
        clashConfig.obfs = params.get('obfs-password');
      }
      
      // SNI
      if (params.has('sni')) {
        clashConfig.sni = params.get('sni');
      }
      
      // 指纹
      if (params.has('fingerprint')) {
        clashConfig.fingerprint = params.get('fingerprint');
      }
      
      return clashConfig;
    } catch (err) {
      console.error('解析Hysteria2 URI失败:', err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为Hysteria2 URI
   * @param {Object} clashConfig - Clash代理配置对象
   * @returns {string|null} - Hysteria2 URI或null
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }
      
      const { name, server, port, password } = clashConfig;
      
      if (!server || !port || !password) {
        console.error('缺少必要的Hysteria2配置参数');
        return null;
      }
      
      // 构建基本URI
      let uri = `hysteria2://${password}@${server}:${port}?`;
      
      // 添加参数
      const params = new URLSearchParams();
      
      // 跳过证书验证
      if (clashConfig['skip-cert-verify']) {
        params.append('insecure', '1');
      }
      
      // ALPN
      if (clashConfig.alpn && clashConfig.alpn.length > 0) {
        params.append('alpn', clashConfig.alpn[0]);
      }
      
      // 上行带宽
      if (clashConfig.up) {
        params.append('upmbps', clashConfig.up);
      }
      
      // 下行带宽
      if (clashConfig.down) {
        params.append('downmbps', clashConfig.down);
      }
      
      // 混淆密码
      if (clashConfig.obfs) {
        params.append('obfs', clashConfig.obfs);
      }
      
      // SNI
      if (clashConfig.sni) {
        params.append('sni', clashConfig.sni);
      }
      
      // 指纹
      if (clashConfig.fingerprint) {
        params.append('fingerprint', clashConfig.fingerprint);
      }
      
      // 添加参数到URI
      uri += params.toString();
      
      // 添加名称（如果有）
      if (name) {
        uri += `#${encodeURIComponent(name)}`;
      }
      
      return uri;
    } catch (err) {
      console.error('生成Hysteria2 URI失败:', err.message);
      return null;
    }
  }
}

module.exports = Hysteria2Converter;
