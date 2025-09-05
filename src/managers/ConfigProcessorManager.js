const fs = require('fs/promises');
const path = require('path');

// 定义策略文件存放的目录，使用 path.join 确保路径正确
// __dirname 指向当前文件 (ConfigProcessorManager.js) 所在的目录 (src/managers)
// '..' 返回上一级目录 (src)
// 'config-strategies' 进入我们的策略目录
const STRATEGIES_DIR = path.join(__dirname, '..', 'config-strategies');

/**
 * 根据场景名称处理节点列表
 * @param {Array<Object>} nodes 节点对象数组
 * @param {string} scenarioName 场景名称 (例如 'default', 'computer-use')
 * @returns {Promise<Object>} 返回生成的 Clash 配置对象
 */
async function processNodes(nodes, scenarioName = 'default') {
  const safeScenarioName = scenarioName || 'default';

  // 安全校验：只允许字母、数字、下划线和连字符，防止路径遍历
  if (!/^[a-zA-Z0-9_-]+$/.test(safeScenarioName)) {
    throw new Error(`Invalid scenario name: ${safeScenarioName}`);
  }

  const strategyPath = path.join(STRATEGIES_DIR, `${safeScenarioName}.js`);

  try {
    // 动态加载策略模块
    const strategyModule = require(strategyPath);

    if (typeof strategyModule.process === 'function') {
      // 执行策略的 process 函数并返回结果
      // 使用 Promise.resolve 包装以确保即使 process 是同步函数也能统一处理
      return Promise.resolve(strategyModule.process(nodes));
    } else {
      throw new Error(`Strategy '${safeScenarioName}' does not have an export named 'process'.`);
    }
  } catch (error) {
    // 捕获 require 失败等错误
    console.error(`Failed to load or execute strategy '${safeScenarioName}':`, error);
    // 可以选择抛出更友好的错误信息
    throw new Error(`Could not process nodes for scenario '${safeScenarioName}'.`);
  }
}

/**
 * 获取所有可用的策略场景名称
 * @returns {Promise<Array<string>>} 返回一个包含所有场景名称的数组
 */
async function getAvailableScenarios() {
  try {
    const files = await fs.readdir(STRATEGIES_DIR);
    return files
      .filter(file => file.endsWith('.js'))
      .map(file => file.slice(0, -3)); // 移除 '.js' 后缀
  } catch (error) {
    console.error('Failed to read strategies directory:', error);
    return []; // 出错时返回空数组
  }
}

module.exports = {
  processNodes,
  getAvailableScenarios,
};