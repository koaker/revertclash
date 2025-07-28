<script setup>
import { useAuthStore } from '@/stores/authStore';
import { onMounted, ref, computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const isMobileMenuOpen = ref(false);

// 在应用根组件挂载时，检查用户的登录状态
onMounted(() => {
  authStore.checkAuthStatus();
});

// 计算当前页面标题
const currentPageTitle = computed(() => {
  const titleMap = {
    '/nodes': '节点管理',
    '/subscriptions': '订阅管理',
    '/account': '账户管理',
    '/config-lab': '配置实验室',
    '/login': '用户登录'
  };
  return titleMap[route.path] || 'RevertClash';
});

// 导航菜单项
const navigationItems = [
  {
    path: '/nodes',
    name: '节点管理',
    icon: 'bi-hdd-network',
    description: '管理和筛选代理节点'
  },
  {
    path: '/subscriptions',
    name: '订阅管理',
    icon: 'bi-link-45deg',
    description: '管理订阅链接'
  },
  {
    path: '/config-lab',
    name: '配置实验室',
    icon: 'bi-gear-wide-connected',
    description: '高级配置工具'
  },
  {
    path: '/account',
    name: '账户管理',
    icon: 'bi-person-gear',
    description: '账户设置和管理'
  }
];

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = () => {
  authStore.logout();
  closeMobileMenu();
};
</script>

<template>
  <div id="app-layout" :class="{ 'mobile-menu-open': isMobileMenuOpen }">
    <!-- 顶部导航栏 -->
    <header class="app-header" v-if="authStore.isLoggedIn">
      <nav class="main-nav">
        <div class="nav-container">
          <!-- Logo和品牌 -->
          <div class="nav-brand">
            <div class="brand-logo">
              <i class="bi bi-shield-check"></i>
            </div>
            <div class="brand-info">
              <h1 class="brand-title">RevertClash</h1>
              <p class="brand-subtitle">代理管理平台</p>
            </div>
          </div>

          <!-- 桌面端导航菜单 -->
          <div class="nav-menu desktop-only">
            <RouterLink
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ 'active': route.path === item.path }"
              @click="closeMobileMenu"
            >
              <i class="nav-icon" :class="item.icon"></i>
              <div class="nav-text">
                <span class="nav-name">{{ item.name }}</span>
                <span class="nav-desc">{{ item.description }}</span>
              </div>
            </RouterLink>
          </div>

          <!-- 用户信息和操作 -->
          <div class="nav-user">
            <div class="user-info">
              <div class="user-avatar">
                <i class="bi bi-person-circle"></i>
              </div>
              <div class="user-details desktop-only">
                <div class="user-name">{{ authStore.user.username }}</div>
                <div class="user-role">{{ authStore.isAdmin ? '管理员' : '用户' }}</div>
              </div>
            </div>
            <div class="user-actions">
              <button class="action-btn desktop-only" @click="handleLogout" title="退出登录">
                <i class="bi bi-box-arrow-right"></i>
              </button>
              <button class="mobile-menu-btn mobile-only" @click="toggleMobileMenu">
                <i class="bi" :class="isMobileMenuOpen ? 'bi-x' : 'bi-list'"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- 移动端菜单 -->
      <div class="mobile-menu" :class="{ 'open': isMobileMenuOpen }">
        <div class="mobile-menu-content">
          <div class="mobile-user-info">
            <div class="mobile-user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="mobile-user-details">
              <div class="mobile-user-name">{{ authStore.user.username }}</div>
              <div class="mobile-user-role">{{ authStore.isAdmin ? '管理员' : '用户' }}</div>
            </div>
          </div>

          <div class="mobile-nav-items">
            <RouterLink
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
              class="mobile-nav-item"
              :class="{ 'active': route.path === item.path }"
              @click="closeMobileMenu"
            >
              <i class="mobile-nav-icon" :class="item.icon"></i>
              <div class="mobile-nav-text">
                <span class="mobile-nav-name">{{ item.name }}</span>
                <span class="mobile-nav-desc">{{ item.description }}</span>
              </div>
            </RouterLink>
          </div>

          <div class="mobile-actions">
            <button class="mobile-logout-btn" @click="handleLogout">
              <i class="bi bi-box-arrow-right"></i>
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 移动端遮罩层 -->
      <div class="mobile-overlay" :class="{ 'show': isMobileMenuOpen }" @click="closeMobileMenu"></div>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main" :class="{ 'with-header': authStore.isLoggedIn }">
      <!-- 路由视图 -->
      <div class="router-container">
        <RouterView />
      </div>
    </main>

    <!-- 全局加载指示器 -->
    <div class="global-loading" v-if="authStore.isLoading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>正在加载...</p>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局CSS重置和基础样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #2c3e50;
  background: #f8f9fa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 全局工具类 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }
}
</style>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

/* 顶部导航栏 */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.main-nav {
  width: 100%;
}

.nav-container {
  width: 100%;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

/* 品牌区域 */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-logo {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: #7f8c8d;
  line-height: 1;
}

/* 桌面端导航菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  text-decoration: none;
  color: #555;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.nav-item:hover::before {
  opacity: 0.1;
}

.nav-item.active::before {
  opacity: 0.15;
}

.nav-item.active {
  color: #667eea;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
  min-width: 20px;
}

.nav-text {
  display: flex;
  flex-direction: column;
}

.nav-name {
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1;
}

.nav-desc {
  font-size: 0.75rem;
  opacity: 0.7;
  line-height: 1;
  margin-top: 0.25rem;
}

/* 用户区域 */
.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  line-height: 1;
}

.user-role {
  font-size: 0.8rem;
  color: #7f8c8d;
  line-height: 1;
  margin-top: 0.25rem;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn,
.mobile-menu-btn {
  width: 45px;
  height: 45px;
  border: none;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.action-btn:hover,
.mobile-menu-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.05);
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  z-index: 999;
  overflow-y: auto;
}

.mobile-menu.open {
  transform: translateY(0);
}

.mobile-menu-content {
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 16px;
  margin-bottom: 2rem;
}

.mobile-user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}

.mobile-user-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
}

.mobile-user-role {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
}

.mobile-nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 16px;
  text-decoration: none;
  color: #555;
  transition: all 0.3s ease;
  background: rgba(248, 249, 250, 0.8);
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
  color: #667eea;
  transform: translateX(8px);
}

.mobile-nav-icon {
  font-size: 1.5rem;
  min-width: 24px;
}

.mobile-nav-text {
  display: flex;
  flex-direction: column;
}

.mobile-nav-name {
  font-weight: 500;
  font-size: 1rem;
}

.mobile-nav-desc {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.mobile-actions {
  padding-top: 2rem;
  border-top: 1px solid #f0f0f0;
}

.mobile-logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 998;
}

.mobile-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* 主内容区域 */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  position: relative;
}

.app-main.with-header {
  min-height: 100vh;
  padding-top: 0;
}

/* 路由容器 */
.router-container {
  flex: 1;
  width: 100%;
  position: relative;
  padding: 0;
}

/* 全局加载指示器 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .nav-container {
    padding: 0 1.5rem;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    height: 70px;
  }

  .brand-title {
    font-size: 1.25rem;
  }

  .brand-subtitle {
    font-size: 0.8rem;
  }

  .mobile-menu {
    top: 70px;
  }

    .app-main.with-header {
    min-height: calc(100vh - 70px);
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 0.75rem;
    height: 65px;
  }

  .brand-logo {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .brand-title {
    font-size: 1.1rem;
  }

  .user-avatar,
  .action-btn,
  .mobile-menu-btn {
    width: 40px;
    height: 40px;
  }

  .mobile-menu {
    top: 65px;
  }

  .mobile-menu-content {
    padding: 1.5rem;
  }

    .app-main.with-header {
    min-height: calc(100vh - 65px);
  }
}

/* 路由过渡动画 */
.router-container {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
