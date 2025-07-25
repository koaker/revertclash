import router from '@/router'; // 引入 Vue Router 实例
import * as authService from '@/services/authService';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // ========== State (状态) ==========
  // 存储当前登录的用户信息，初始为 null
  const user = ref(null);
  // 存储认证过程中发生的错误
  const authError = ref(null);
  // 标记是否正在进行认证相关的 API 调用
  const isLoading = ref(false);

  // ========== Getters (计算属性) ==========
  // 一个简单的布尔值，表示用户是否已登录
  const isLoggedIn = computed(() => !!user.value);
  // 检查用户是否是管理员
  const isAdmin = computed(() => user.value?.isAdmin || false);

  // ========== Actions (方法) ==========
  /**
   * 登录
   * @param {string} username
   * @param {string} password
   */
  async function login(username, password) {
    isLoading.value = true;
    authError.value = null;
    try {
      const data = await authService.login(username, password);
      // 登录成功后，后端会返回用户信息，我们用它来更新 state
      user.value = data.user;
      // 登录成功后，根据后端返回的建议，跳转到相应页面
      router.push(data.redirect || '/nodes');
    } catch (error) {
      authError.value = error.message;
      console.error('登录失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    isLoading.value = true;
    authError.value = null;
    try {
      await authService.logout();
      // 退出成功后，清空本地的用户信息
      user.value = null;
      // 跳转到登录页
      router.push('/login');
    } catch (error) {
      authError.value = error.message;
      console.error('退出失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 检查并恢复登录状态
   * 这个 action 应该在应用初始化时被调用
   */
  async function checkAuthStatus() {
    // 如果已经有用户信息，就不再重复检查
    if (user.value) return;

    isLoading.value = true;
    try {
      const data = await authService.checkAuthStatus();
      if (data.loggedIn) {
        user.value = data.user;
      } else {
        user.value = null;
      }
    } catch (error) {
      // 检查状态失败时，我们假定用户未登录
      user.value = null;
      console.error('检查认证状态失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    user,
    authError,
    isLoading,
    // Getters
    isLoggedIn,
    isAdmin,
    // Actions
    login,
    logout,
    checkAuthStatus,
  };
});
