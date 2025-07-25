// 定义后端 API 的基础路径
const API_BASE_URL = '/api/nodes';

/**
 * 从服务器获取所有节点列表。
 * @returns {Promise<Array>} 返回一个包含节点对象的数组。
 */
export async function fetchNodes() {
  // 注意：在 Vite 开发环境中，'/api' 请求会被代理到后端服务器，
  // 这需要在 vite.config.js 中配置。
  const response = await fetch(API_BASE_URL);
  if (!response.ok) {
    throw new Error(`网络错误: ${response.status}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'API 返回了一个错误');
  }
  return data.nodes;
}

/**
 * 批量更新节点的选中状态。
 * 这是对旧代码中批处理逻辑的简化实现。
 * @param {string[]} nodesToSelect - 需要选中的节点名称数组。
 * @param {string[]} nodesToDeselect - 需要取消选中的节点名称数组。
 * @returns {Promise<void>}
 */
export async function updateMultipleNodeSelection(nodesToSelect, nodesToDeselect) {
  const promises = [];

  if (nodesToSelect.length > 0) {
    promises.push(
      fetch(`${API_BASE_URL}/select-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeNames: nodesToSelect })
      })
    );
  }

  if (nodesToDeselect.length > 0) {
    promises.push(
      fetch(`${API_BASE_URL}/deselect-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeNames: nodesToDeselect })
      })
    );
  }

  const responses = await Promise.all(promises);
  // 检查所有请求是否都成功
  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`批量更新节点状态失败: ${response.status}`);
    }
  }
}

/**
 * 请求全选所有节点
 * @returns {Promise<Object>}
 */
export async function selectAllNodes() {
    const response = await fetch(`${API_BASE_URL}/select-all`, { method: 'POST' });
    if (!response.ok) throw new Error('全选操作失败');
    return response.json();
}

/**
 * 请求取消全选所有节点
 * @returns {Promise<Object>}
 */
export async function deselectAllNodes() {
    const response = await fetch(`${API_BASE_URL}/deselect-all`, { method: 'POST' });
    if (!response.ok) throw new Error('取消全选操作失败');
    return response.json();
}

// 未来我们可以在这里添加更多函数，例如获取节点详情、导出配置等。
