// 定义认证 API 的基础路径
const API_BASE_URL = '/auth';

/**
 * 发送登录请求
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<Object>} 返回包含用户信息的对象
 */
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    // 如果服务器返回了错误信息，就抛出这个错误
    throw new Error(data.error || `HTTP ${response.status}: 登录失败`);
  }

  return data; // 成功时返回 { status: 'success', user: {...} }
}

/**
 * 发送登出请求
 * @returns {Promise<Object>}
 */
export async function logout() {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: 退出失败`);
  }

  return data;
}

/**
 * 检查当前的认证状态
 * @returns {Promise<Object>} 返回 { loggedIn: boolean, user?: object }
 */
export async function checkAuthStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);
  // 对于检查状态，即使401等也是一种“有效”状态，所以我们不在这里抛出错误
  // 具体的逻辑留给 store 处理
  return response.json();
}

/**
 * 修改当前用户的密码
 * @param {object} passwordData - { currentPassword, newPassword }
 * @returns {Promise<Object>}
 */
export async function changePassword(passwordData) {
  const response = await fetch(`${API_BASE_URL}/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(passwordData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: 修改密码失败`);
  }

  return data;
}

/**
 * 检查系统是否需要初始设置
 * @returns {Promise<Object>} 返回 { needsSetup: boolean }
 */
export async function checkSetupStatus() {
  const response = await fetch(`${API_BASE_URL}/setup-status`);
  return response.json();
}
