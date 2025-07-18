// 文件名: src/converters/Socks5Converter.js

const BaseConverter = require('./baseConverter');
const { URL } = require('url'); // 使用内置的URL模块

/**
 * SOCKS5 协议转换器
 * (支持标准及非标准的Base64认证格式)
 */
class Socks5Converter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   */
  canHandleUri(uri) {
    // 支持 socks:// 和 socks5:// 两种常见协议头
    return typeof uri === 'string' && (uri.startsWith('socks://') || uri.startsWith('socks5://'));
  }

  /**
   * 检查是否可以处理给定的Clash配置
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'socks5';
  }

  /**
   * 将SOCKS5 URI转换为Clash代理配置
   * (兼容标准明文和非标准Base64两种格式)
   */
  uriToClash(uri) {
    try {
      if (!this.canHandleUri(uri)) {
        return null;
      }

      const url = new URL(uri);

      const server = url.hostname;
      const port = parseInt(url.port, 10);
      const name = url.hash ? decodeURIComponent(url.hash.substring(1)) : `${server}:${port}`;

      if (!server || !port) {
        console.error('无效的SOCKS5 URI：缺少服务器地址或端口');
        return null;
      }

      let username;
      let password;

      // 1. 优先按标准格式解析 (URL构造函数会自动处理URL解码)
      if (url.username) {
          username = url.username;
      }
      if (url.password) {
          password = url.password;
      }

      // 2. 如果没有密码但有用户名，则尝试回退到非标准的Base64格式解析
      if (!password && username) {
        try {
          const decodedInfo = Buffer.from(username, 'base64').toString('utf-8');
          const colonIndex = decodedInfo.indexOf(':');
          
          // 确保解码后包含 ":" 分隔符，且用户名和密码都不为空
          if (colonIndex > 0 && colonIndex < decodedInfo.length - 1) {
            console.log('检测到非标准的Base64编码认证信息，已进行解析。');
            username = decodedInfo.substring(0, colonIndex);
            password = decodedInfo.substring(colonIndex + 1);
          }
        } catch (e) {
          // Base64解码失败，说明它就是一个普通的用户名。
          // 无需做任何事，保留原始解析出的 username 即可。
        }
      }

      const clashConfig = {
        name,
        type: 'socks5',
        server,
        port,
        ...(username && { username }),
        ...(password && { password }),
        udp: true
      };

      return clashConfig;
    } catch (err) {
      console.error(`解析SOCKS5 URI失败: ${uri}`, err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为SOCKS5 URI
   * (始终生成标准格式的URI)
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }

      const { name, server, port, username, password } = clashConfig;

      if (!server || !port) {
        console.error('缺少必要的SOCKS5配置参数');
        return null;
      }
      
      let authPart = '';
      if (username && password) {
        // 对用户名和密码进行URL编码，以防包含特殊字符
        authPart = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
      } else if (username) {
        authPart = `${encodeURIComponent(username)}@`;
      }

      // 始终生成标准的 socks5:// 链接
      const uri = `socks5://${authPart}${server}:${port}#${encodeURIComponent(name)}`;
      
      return uri;
    } catch (err) {
      console.error('生成SOCKS5 URI失败:', err.message);
      return null;
    }
  }
}

module.exports = Socks5Converter;
