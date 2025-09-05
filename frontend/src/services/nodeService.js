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

// 未来我们可以在这里添加更多函数，例如获取节点详情、导出配置等。

/**
 * 导出选中节点的链接
 * @param {string[]} nodeNames - 要导出的节点名称数组
 * @returns {Promise<Object>}
 */
export async function exportNodeLinks(nodes) {
  const response = await fetch(`${API_BASE_URL}/export-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes: nodes })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '导出链接失败');
  }
  return data;
}

/**
 * 将选中的节点列表发送到后端以生成配置文件。
 * @param {Array<Object>} nodes - 包含完整节点配置的数组。
 * @param {string} scenario - 是否需要后端进行额外处理（对应 clash-configs.js）。
 * @returns {Promise<Blob>} 返回一个可供下载的 Blob 对象。
 */
export async function generateConfig(nodes, scenario) {
  const response = await fetch(`${API_BASE_URL}/config/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, scenario }) // <--- 修改点 2：发送 scenario
  });

  if (!response.ok) {
    try {
        const errorData = await response.json();
        throw new Error(errorData.error || `生成配置失败: ${response.status}`);
    } catch (e) {
        throw new Error(`生成配置失败: ${response.status}`);
    }
  }
  return response.blob();
}

/**
 * 从服务器获取所有可用的处理场景。
 * @returns {Promise<Array<string>>} 返回一个包含场景名称的字符串数组。
 */
export async function fetchScenarios() {
  const response = await fetch(`${API_BASE_URL}/scenarios`);
  if (!response.ok) {
    throw new Error(`网络错误: ${response.status}`);
  }
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '获取场景列表失败');
  }
  return data.scenarios;
}
