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
      // 首先检测是否为Legacy格式（整体BASE64编码格式）
      if (this._isLegacyFormat(uri)) {
        console.log('检测到Legacy格式SS链接，使用专用解析器');
        return this._parseLegacyFormat(uri);
      }

      // 标准格式解析: ss://BASE64(method:password)@server:port#name
      // 使用更直接的字符串解析方法，避免Node.js URL解析器的BASE64处理问题
      
      // 提取各个部分
      const atIndex = uri.indexOf('@');
      const hashIndex = uri.indexOf('#');
      
      if (atIndex === -1) {
        console.error('无效的SS URI格式 (缺少@符号)');
        return this._parseLegacyFormat(uri);
      }
      
      // 提取BASE64部分
      const base64Part = uri.substring(5, atIndex); // 去掉'ss://'
      
      // 检查是否有URL参数
      const questionIndex = uri.indexOf('?');
      
      // 提取服务器部分 (需要考虑URL参数)
      let serverPart;
      let urlParams = '';
      
      if (questionIndex !== -1 && (hashIndex === -1 || questionIndex < hashIndex)) {
        // 有URL参数的情况: @server:port?params#name
        serverPart = uri.substring(atIndex + 1, questionIndex);
        const paramsEnd = hashIndex !== -1 ? hashIndex : uri.length;
        urlParams = uri.substring(questionIndex + 1, paramsEnd);
      } else if (hashIndex !== -1) {
        // 没有URL参数但有名称: @server:port#name
        serverPart = uri.substring(atIndex + 1, hashIndex);
      } else {
        // 只有服务器部分: @server:port
        serverPart = uri.substring(atIndex + 1);
      }
      
      // 提取名称部分
      let name = '';
      if (hashIndex !== -1) {
        name = decodeURIComponent(uri.substring(hashIndex + 1));
      }
      
      // 解析服务器和端口
      const colonIndex = serverPart.lastIndexOf(':');
      if (colonIndex === -1) {
        console.error('无效的SS URI格式 (服务器部分缺少端口)');
        return this._parseLegacyFormat(uri);
      }
      
      const server = serverPart.substring(0, colonIndex);
      const port = serverPart.substring(colonIndex + 1);
      
      // 验证端口是数字
      if (!/^\d+$/.test(port)) {
        console.error('无效的SS URI格式 (端口不是数字)');
        return this._parseLegacyFormat(uri);
      }
      
      // 解析BASE64编码的用户信息
      if (!this._isBase64(base64Part)) {
        console.error('无效的SS URI格式 (BASE64部分无效)');
        return this._parseLegacyFormat(uri);
      }
      
      let userInfo;
      try {
        userInfo = Buffer.from(base64Part, 'base64').toString();
      } catch (err) {
        console.error('解析SS用户信息失败:', err.message);
        return this._parseLegacyFormat(uri);
      }
      
      // 分离加密方法和密码 (只在第一个冒号处分割，支持密码中包含冒号)
      const firstColonIndex = userInfo.indexOf(':');
      if (firstColonIndex === -1) {
        console.error('无效的SS URI格式 (缺少加密方法或密码分隔符)');
        return this._parseLegacyFormat(uri);
      }
      
      const method = userInfo.substring(0, firstColonIndex);
      const password = userInfo.substring(firstColonIndex + 1);
      
      if (!method || !password) {
        console.error('无效的SS URI格式 (缺少加密方法或密码)');
        return this._parseLegacyFormat(uri);
      }
      
      // 如果没有名称，使用服务器和端口作为名称
      if (!name) {
        name = `${server}:${port}`;
      }
      
      // 创建Clash配置对象
      const clashConfig = {
        name,
        type: 'ss',
        server,
        port: parseInt(port, 10),
        cipher: method,
        password: password,
        // 可选参数
        'udp': true
      };
      
      // 处理URL参数
      if (urlParams) {
        console.log('检测到URL参数:', urlParams);
        // 解析URL参数并添加到配置中
        const params = new URLSearchParams(urlParams);
        for (const [key, value] of params) {
          if (key === 'type' && value === 'tcp') {
            // TCP类型参数，保持默认UDP设置
            continue;
          }
          // 其他参数可以根据需要添加到配置中
          console.log(`URL参数: ${key} = ${value}`);
        }
      }
      
      return clashConfig;
    } catch (err) {
      console.error('标准格式解析SS URI失败:', err.message);
      // 最后尝试Legacy格式解析
      console.log('进行最终的Legacy格式解析尝试');
      return this._parseLegacyFormat(uri);
    }
  }

  /**
   * 检测是否为Legacy格式的SS URI
   * Legacy格式: ss://BASE64(method:password@server:port)#name
   * 标准格式: ss://BASE64(method:password)@server:port#name
   * @private
   * @param {string} uri - SS URI
   * @returns {boolean} - 如果是Legacy格式则返回true
   */
  _isLegacyFormat(uri) {
    try {
      // 基本格式检查
      if (!uri.startsWith('ss://')) {
        return false;
      }

      // 检查URI结构：Legacy格式不会有@符号在BASE64编码外部
      // 标准格式: ss://BASE64@server:port
      // Legacy格式: ss://BASE64#name (整个连接信息都在BASE64中)
      
      const hashIndex = uri.indexOf('#');
      const checkPart = hashIndex === -1 ? uri : uri.substring(0, hashIndex);
      
      // 如果包含@符号，很可能是标准格式
      if (checkPart.includes('@')) {
        // 进一步验证：标准格式的@后面应该是server:port格式
        const atIndex = checkPart.indexOf('@');
        const afterAt = checkPart.substring(atIndex + 1);
        
        // 检查@后面是否像server:port格式 (包含冒号和数字端口)
        const colonIndex = afterAt.lastIndexOf(':');
        if (colonIndex !== -1) {
          const portPart = afterAt.substring(colonIndex + 1);
          if (/^\d+$/.test(portPart)) {
            return false; // 这是标准格式
          }
        }
      }

      // 提取BASE64部分（去掉ss://和可能的#name部分）
      const base64Part = hashIndex === -1 
        ? uri.substring(5) 
        : uri.substring(5, hashIndex);

      // 尝试解码BASE64
      if (!this._isBase64(base64Part)) {
        return false;
      }

      const decoded = Buffer.from(base64Part, 'base64').toString();
      
      // Legacy格式解码后应该包含method:password@server:port格式
      const parts = decoded.split('@');
      if (parts.length !== 2) {
        return false; // 不是Legacy格式
      }

      const [authPart, serverPart] = parts;
      
      // 验证认证部分包含冒号分隔的method:password
      if (!authPart.includes(':')) {
        return false;
      }

      // 验证服务器部分包含端口
      if (!serverPart.includes(':')) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * 解析Legacy格式的SS URI
   * @private
   * @param {string} uri - Legacy格式的SS URI
   * @returns {Object|null} - Clash代理配置对象或null
   */
  _parseLegacyFormat(uri) {
    try {
      // 提取BASE64部分（去掉ss://和可能的#name部分）
      const hashIndex = uri.indexOf('#');
      const base64Part = hashIndex === -1 
        ? uri.substring(5) 
        : uri.substring(5, hashIndex);

      // 提取节点名称
      let name = '';
      if (hashIndex !== -1) {
        name = decodeURIComponent(uri.substring(hashIndex + 1));
      }

      // 解码BASE64内容
      if (!this._isBase64(base64Part)) {
        console.error('Legacy格式SS URI包含无效的BASE64内容');
        return null;
      }

      const decoded = Buffer.from(base64Part, 'base64').toString();
      console.log('Legacy格式解码内容:', decoded);

      // 解析decoded内容: method:password@server:port
      const parts = decoded.split('@');
      if (parts.length !== 2) {
        console.error('Legacy格式解码后格式无效，缺少@分隔符');
        return null;
      }

      const [authPart, serverPart] = parts;

      // 解析认证部分: method:password (支持密码中包含冒号)
      const firstColonIndex = authPart.indexOf(':');
      if (firstColonIndex === -1) {
        console.error('Legacy格式认证部分缺少分隔符');
        return null;
      }
      
      const method = authPart.substring(0, firstColonIndex);
      const password = authPart.substring(firstColonIndex + 1);
      
      if (!method || !password) {
        console.error('Legacy格式认证部分格式无效');
        return null;
      }

      // 解析服务器部分: server:port
      const lastColonIndex = serverPart.lastIndexOf(':');
      if (lastColonIndex === -1) {
        console.error('Legacy格式服务器部分缺少端口');
        return null;
      }

      const server = serverPart.substring(0, lastColonIndex);
      const port = serverPart.substring(lastColonIndex + 1);

      // 验证必要字段
      if (!method || !password || !server || !port) {
        console.error('Legacy格式解析后缺少必要字段');
        return null;
      }

      // 如果没有名称，使用服务器和端口作为名称
      if (!name) {
        name = `${server}:${port}`;
      }

      // 创建Clash配置对象
      const clashConfig = {
        name,
        type: 'ss',
        server,
        port: parseInt(port, 10),
        cipher: method,
        password: password,
        // 可选参数
        'udp': true
      };

      console.log('Legacy格式解析成功:', clashConfig);
      return clashConfig;

    } catch (err) {
      console.error('解析Legacy格式SS URI失败:', err.message);
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
      // 检查是否包含有效的BASE64字符
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
        return false;
      }
      
      // 尝试解码，如果成功说明是有效的BASE64
      Buffer.from(str, 'base64').toString();
      return true;
    } catch (err) {
      return false;
    }
  }
}

module.exports = SSConverter;
