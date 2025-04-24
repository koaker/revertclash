/**
 * VMess协议转换器
 * 用于VMess协议与Clash配置之间的转换
 */
const BaseConverter = require('./baseConverter');

class VMessConverter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   * @param {string} uri - 要检查的URI
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('vmess://');
  }

  /**
   * 检查是否可以处理给定的Clash配置
   * @param {Object} clashConfig - 要检查的Clash配置
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'vmess';
  }

  /**
   * 将VMess URI转换为Clash代理配置
   * @param {string} uri - VMess URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  uriToClash(uri) {
    try {
      // VMess URI格式: vmess://BASE64(JSON)
      if (!uri.startsWith('vmess://')) {
        console.error('无效的VMess URI格式');
        return null;
      }

      // 提取并解码BASE64部分
      const base64Content = uri.substring(8); // 去掉 'vmess://'
      let jsonContent;
      
      try {
        jsonContent = Buffer.from(base64Content, 'base64').toString('utf8');
      } catch (err) {
        console.error('解析VMess BASE64内容失败:', err.message);
        return null;
      }

      // 解析JSON内容
      let vmessConfig;
      try {
        vmessConfig = JSON.parse(jsonContent);
      } catch (err) {
        console.error('解析VMess JSON内容失败:', err.message);
        return null;
      }

      // 验证必要字段
      if (!vmessConfig.add || !vmessConfig.port || !vmessConfig.id) {
        console.error('VMess配置缺少必要字段');
        return null;
      }

      // 创建Clash配置对象
      const clashConfig = {
        name: vmessConfig.ps || `${vmessConfig.add}:${vmessConfig.port}`,
        type: 'vmess',
        server: vmessConfig.add,
        port: parseInt(vmessConfig.port, 10),
        uuid: vmessConfig.id,
        alterId: parseInt(vmessConfig.aid || '0', 10),
        cipher: vmessConfig.scy || 'auto',
        udp: true
      };

      // 添加网络设置
      if (vmessConfig.net) {
        clashConfig.network = vmessConfig.net;
        
        // 根据不同网络类型添加特定配置
        switch (vmessConfig.net) {
          case 'ws':
            if (vmessConfig.path) clashConfig['ws-path'] = vmessConfig.path;
            if (vmessConfig.host) clashConfig['ws-headers'] = { Host: vmessConfig.host };
            break;
          case 'h2':
            if (vmessConfig.path) clashConfig['h2-path'] = vmessConfig.path;
            if (vmessConfig.host) clashConfig['h2-host'] = [vmessConfig.host];
            break;
          case 'grpc':
            if (vmessConfig.path) clashConfig['grpc-service-name'] = vmessConfig.path;
            break;
          case 'http':
            if (vmessConfig.path) clashConfig['http-path'] = [vmessConfig.path];
            if (vmessConfig.host) clashConfig['http-host'] = [vmessConfig.host];
            break;
        }
      }

      // 添加TLS设置
      if (vmessConfig.tls === 'tls') {
        clashConfig.tls = true;
        if (vmessConfig.sni) clashConfig.sni = vmessConfig.sni;
        if (vmessConfig.alpn) clashConfig.alpn = Array.isArray(vmessConfig.alpn) ? vmessConfig.alpn : [vmessConfig.alpn];
        if (vmessConfig.fp) clashConfig['client-fingerprint'] = vmessConfig.fp;
      }

      return clashConfig;
    } catch (err) {
      console.error('解析VMess URI失败:', err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为VMess URI
   * @param {Object} clashConfig - Clash代理配置对象
   * @returns {string|null} - VMess URI或null
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }

      const { name, server, port, uuid, alterId, cipher, network } = clashConfig;

      if (!server || !port || !uuid) {
        console.error('缺少必要的VMess配置参数');
        return null;
      }

      // 构建VMess配置对象
      const vmessConfig = {
        v: '2',
        ps: name || `${server}:${port}`,
        add: server,
        port: port.toString(),
        id: uuid,
        aid: (alterId || 0).toString(),
        scy: cipher || 'auto',
        net: network || 'tcp',
        type: 'none',
        host: '',
        path: '',
        tls: '',
        sni: '',
        alpn: '',
        fp: ''
      };

      // 根据网络类型设置特定配置
      if (network) {
        switch (network) {
          case 'ws':
            vmessConfig.path = clashConfig['ws-path'] || '';
            if (clashConfig['ws-headers'] && clashConfig['ws-headers'].Host) {
              vmessConfig.host = clashConfig['ws-headers'].Host;
            }
            break;
          case 'h2':
            vmessConfig.path = clashConfig['h2-path'] || '';
            if (clashConfig['h2-host'] && clashConfig['h2-host'].length > 0) {
              vmessConfig.host = clashConfig['h2-host'][0];
            }
            break;
          case 'grpc':
            vmessConfig.path = clashConfig['grpc-service-name'] || '';
            break;
          case 'http':
            if (clashConfig['http-path'] && clashConfig['http-path'].length > 0) {
              vmessConfig.path = clashConfig['http-path'][0];
            }
            if (clashConfig['http-host'] && clashConfig['http-host'].length > 0) {
              vmessConfig.host = clashConfig['http-host'][0];
            }
            break;
        }
      }

      // 设置TLS配置
      if (clashConfig.tls) {
        vmessConfig.tls = 'tls';
        if (clashConfig.sni) vmessConfig.sni = clashConfig.sni;
        if (clashConfig.alpn && clashConfig.alpn.length > 0) {
          vmessConfig.alpn = clashConfig.alpn.join(',');
        }
        if (clashConfig['client-fingerprint']) {
          vmessConfig.fp = clashConfig['client-fingerprint'];
        }
      }

      // 将配置转换为JSON并进行BASE64编码
      const jsonString = JSON.stringify(vmessConfig);
      const base64Content = Buffer.from(jsonString).toString('base64');

      return `vmess://${base64Content}`;
    } catch (err) {
      console.error('生成VMess URI失败:', err.message);
      return null;
    }
  }
}

module.exports = VMessConverter;
