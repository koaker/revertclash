/**
 * VLESS协议转换器
 * 用于VLESS协议与Clash配置之间的转换
 */
const BaseConverter = require('./baseConverter');
const URL = require('url');

class VlessConverter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   * @param {string} uri - 要检查的URI
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('vless://');
  }

  /**
   * 检查是否可以处理给定的Clash配置
   * @param {Object} clashConfig - 要检查的Clash配置
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'vless';
  }

  /**
   * 将VLESS URI转换为Clash代理配置
   * @param {string} uri - VLESS URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  uriToClash(uri) {
    try {
      // VLESS URI格式: vless://uuid@server:port?参数&参数#name
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
        type: 'vless',
        server: url.hostname,
        port: parseInt(url.port, 10),
        uuid: url.username,
        // 默认值
        udp: true,
        'skip-cert-verify': true
      };
      
      // 处理各种参数
      // 传输方式
      if (params.has('type')) {
        clashConfig.network = params.get('type');
      } else {
        clashConfig.network = 'tcp'; // 默认为tcp
      }
      
      // 安全类型
      const security = params.get('security');
      if (security) {
        clashConfig.tls = security === 'tls' || security === 'reality';
        
        // Reality相关参数
        if (security === 'reality') {
          // 同时设置两个属性名，确保兼容性
          clashConfig.reality = true;
          
          // 创建reality-opts对象
          clashConfig["reality-opts"] = {};
          
          // 只在参数存在时添加相应字段
          if (params.has('pbk')) {
            clashConfig["reality-opts"].public_key = params.get('pbk');
          }
          
          if (params.has('sid')) {
            clashConfig["reality-opts"].short_id = params.get('sid');
          }
          
          // Reality SpiderX参数
          if (params.has('spx')) {
            clashConfig["reality-opts"].spiderX = params.get('spx');
          }
          
          // SNI参数
          if (params.has('sni')) {
            clashConfig.servername = params.get('sni');
          }
          
          // 指纹参数
          const validFingerprints = ['chrome', 'firefox', 'safari', 'ios', 'android', 'edge', 'random'];
          if (params.has('fp')) {
            const fingerprint = params.get('fp');
            clashConfig.client_fingerprint = fingerprint;
            // 指纹参数验证日志
            if (!validFingerprints.includes(fingerprint)) {
              console.warn(`非标准指纹参数: ${fingerprint}`);
            }
          }
        }
      }
      
      // 保存加密参数
      if (params.has('encryption')) {
        clashConfig.encryption = params.get('encryption');
      }
      
      // ALPN参数
      if (params.has('alpn')) {
        clashConfig.alpn = params.get('alpn').split(',');
      }
      
      // Flow控制
      if (params.has('flow')) {
        clashConfig.flow = params.get('flow');
      }
      
      // WebSocket相关参数
      if (clashConfig.network === 'ws') {
        if (params.has('path')) {
          clashConfig.ws_opts = {
            path: params.get('path')
          };
          
          // WebSocket主机
          if (params.has('host')) {
            clashConfig.ws_opts.headers = {
              Host: params.get('host')
            };
          }
        }
      }
      
      // HTTP/2相关参数
      if (clashConfig.network === 'h2') {
        clashConfig.h2_opts = {};
        
        if (params.has('path')) {
          clashConfig.h2_opts.path = params.get('path');
        }
        
        if (params.has('host')) {
          clashConfig.h2_opts.host = [params.get('host')];
        }
      }
      
      // gRPC相关参数
      if (clashConfig.network === 'grpc') {
        clashConfig.grpc_opts = {};
        
        if (params.has('serviceName')) {
          clashConfig.grpc_opts.service_name = params.get('serviceName');
        }
      }
      
      return clashConfig;
    } catch (err) {
      console.error('解析VLESS URI失败:', err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为VLESS URI
   * @param {Object} clashConfig - Clash代理配置对象
   * @returns {string|null} - VLESS URI或null
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }
      
      const { name, server, port, uuid, network } = clashConfig;
      
      if (!server || !port || !uuid) {
        console.error('缺少必要的VLESS配置参数');
        return null;
      }
      
      // 构建基本URI
      let uri = `vless://${uuid}@${server}:${port}?`;
      
      // 添加参数
      const params = new URLSearchParams();
      
      // 传输方式
      if (network) {
        params.append('type', network);
      } else {
        params.append('type', 'tcp');
      }
      
      // 安全类型
      if (clashConfig.tls) {
        // 检查是否使用Reality
        if (clashConfig.reality || clashConfig["reality-opts"]) {
          params.append('security', 'reality');
          
          // Reality相关参数 - 优先使用reality-opts
          const realityOpts = clashConfig["reality-opts"] || {};
          
          if (realityOpts.public_key) {
            params.append('pbk', realityOpts.public_key);
          }
          
          if (realityOpts.short_id) {
            params.append('sid', realityOpts.short_id);
          }
          
          // Reality SpiderX参数
          if (realityOpts.spiderX) {
            params.append('spx', realityOpts.spiderX);
          }
        } else {
          params.append('security', 'tls');
        }
        
        // SNI参数
        if (clashConfig.servername) {
          params.append('sni', clashConfig.servername);
        }
        
        // 指纹参数
        if (clashConfig.client_fingerprint) {
          params.append('fp', clashConfig.client_fingerprint);
        }
      } else {
        params.append('security', 'none');
      }
      
      // 加密参数
      if (clashConfig.encryption) {
        params.append('encryption', clashConfig.encryption);
      } else {
        // VLESS默认加密方式
        params.append('encryption', 'none');
      }
      
      // ALPN参数
      if (clashConfig.alpn && Array.isArray(clashConfig.alpn) && clashConfig.alpn.length > 0) {
        params.append('alpn', clashConfig.alpn.join(','));
      }
      
      // Flow控制
      if (clashConfig.flow) {
        params.append('flow', clashConfig.flow);
      }
      
      // WebSocket相关参数
      if (network === 'ws' && clashConfig.ws_opts) {
        if (clashConfig.ws_opts.path) {
          params.append('path', clashConfig.ws_opts.path);
        }
        
        if (clashConfig.ws_opts.headers && clashConfig.ws_opts.headers.Host) {
          params.append('host', clashConfig.ws_opts.headers.Host);
        }
      }
      
      // HTTP/2相关参数
      if (network === 'h2' && clashConfig.h2_opts) {
        if (clashConfig.h2_opts.path) {
          params.append('path', clashConfig.h2_opts.path);
        }
        
        if (clashConfig.h2_opts.host && clashConfig.h2_opts.host.length > 0) {
          params.append('host', clashConfig.h2_opts.host[0]);
        }
      }
      
      // gRPC相关参数
      if (network === 'grpc' && clashConfig.grpc_opts) {
        if (clashConfig.grpc_opts.service_name) {
          params.append('serviceName', clashConfig.grpc_opts.service_name);
        }
      }
      
      // 添加参数到URI
      uri += params.toString();
      
      // 添加名称（如果有）
      if (name) {
        uri += `#${encodeURIComponent(name)}`;
      }
      
      return uri;
    } catch (err) {
      console.error('生成VLESS URI失败:', err.message);
      return null;
    }
  }
}

module.exports = VlessConverter;
