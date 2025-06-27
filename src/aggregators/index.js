/**
 * 聚合器导出文件
 * 统一导出所有聚合相关的类和枚举
 */

const { NodeAggregator, AggregationMode, SortBy } = require('./NodeAggregator');
const { ConflictResolver, ConflictStrategy } = require('./ConflictResolver');

module.exports = {
    // 节点聚合器
    NodeAggregator,
    AggregationMode,
    SortBy,
    
    // 冲突解决器
    ConflictResolver,
    ConflictStrategy
}; 