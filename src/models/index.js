/**
 * 模型导出文件
 * 统一导出所有数据模型类
 */

const ProxyNode = require('./ProxyNode');
const { ConfigSource, SourceStatus, SourceType } = require('./ConfigSource');

module.exports = {
    // 节点模型
    ProxyNode,
    
    // 配置源模型
    ConfigSource,
    SourceStatus,
    SourceType
}; 