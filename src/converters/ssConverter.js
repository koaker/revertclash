/**
 * SS协议转换器
 * 用于SS协议与Clash配置之间的转换
 */
const BaseConverter = require('./baseConverter');
const URL = require('url');

class SSConverter extends BaseConverter {
  /**
   * 检查是否可以处理给定的URI
   * @param {string} uri - 要检查的URI
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleUri(uri) {
    return typeof uri === 'string' && uri.startsWith('ss://');
  }

  /**
   * 检查是否可以处理给定的Clash配置
   * @param {Object} clashConfig - 要检查的Clash配置
   * @returns {boolean} - 如果可以处理则返回true，否则返回false
   */
  canHandleClash(clashConfig) {
    return clashConfig && clashConfig.type === 'ss';
  }

  /**
   * 将SS URI转换为Clash代理配置
   * @param {string} uri - SS URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  uriToClash(uri) {
    try {
      // SS URI格式: ss://BASE64(method:password)@server:port#name
      const url = new URL.URL(uri);
      
      // 解析用户名部分（BASE64编码的method:password）
      let userInfo = url.username;
      
      // 有些SS URI可能会整体BASE64编码，需要检测并处理
      if (!userInfo.includes(':') && this._isBase64(userInfo)) {
        try {
          userInfo = Buffer.from(userInfo, 'base64').toString();
        } catch (err) {
          console.error('解析SS用户信息失败:', err.message);
          return null;
        }
      }
      
      // 分离加密方法和密码
      const [method, password] = userInfo.split(':');
      if (!method || !password) {
        console.error('无效的SS URI格式 (缺少加密方法或密码)');
        return null;
      }
      
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
      return {
        name,
        type: 'ss',
        server: url.hostname,
        port: parseInt(url.port, 10),
        cipher: method,
        password: password,
        // 可选参数
        'udp': true
      };
    } catch (err) {
      console.error('解析SS URI失败:', err.message);
      return null;
    }
  }

  /**
   * 将Clash代理配置转换为SS URI
   * @param {Object} clashConfig - Clash代理配置对象
   * @returns {string|null} - SS URI或null
   */
  clashToUri(clashConfig) {
    try {
      if (!this.canHandleClash(clashConfig)) {
        return null;
      }
      
      const { name, server, port, cipher, password } = clashConfig;
      
      if (!server || !port || !cipher || !password) {
        console.error('缺少必要的SS配置参数');
        return null;
      }
      
      // 构建用户信息部分并进行BASE64编码
      const userInfo = Buffer.from(`${cipher}:${password}`).toString('base64');
      
      // 构建SS URI
      let uri = `ss://${userInfo}@${server}:${port}`;
      
      // 添加名称（如果有）
      if (name) {
        uri += `#${encodeURIComponent(name)}`;
      }
      
      return uri;
    } catch (err) {
      console.error('生成SS URI失败:', err.message);
      return null;
    }
  }
  
  /**
   * 检查字符串是否为有效的BASE64编码
   * @private
   * @param {string} str - 要检查的字符串
   * @returns {boolean} - 如果是有效的BASE64编码则返回true，否则返回false
   */
  _isBase64(str) {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
      return false;
    }
  }
}

module.exports = SSConverter;
