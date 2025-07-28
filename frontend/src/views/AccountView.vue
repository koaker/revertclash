<template>
  <div class="account-view">
    <div class="account-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="bi bi-person-gear"></i>
          </div>
          <div class="header-text">
            <h1 class="page-title">账户管理</h1>
            <p class="page-subtitle">管理您的账户设置和系统配置</p>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="account-layout">
        <!-- 导航侧边栏 -->
        <div class="sidebar">
          <div class="sidebar-content">
            <h3 class="sidebar-title">设置菜单</h3>
            <nav class="sidebar-nav">
              <button
                class="nav-item"
                :class="{ active: activeSection === 'password' }"
                @click="setActiveSection('password')"
              >
                <div class="nav-icon">
                  <i class="bi bi-key"></i>
                </div>
                <div class="nav-text">
                  <span class="nav-name">修改密码</span>
                  <span class="nav-desc">更改登录密码</span>
                </div>
              </button>

              <button
                v-if="authStore.isAdmin"
                class="nav-item"
                :class="{ active: activeSection === 'users' }"
                @click="setActiveSection('users')"
              >
                <div class="nav-icon">
                  <i class="bi bi-people"></i>
                </div>
                <div class="nav-text">
                  <span class="nav-name">用户管理</span>
                  <span class="nav-desc">管理系统用户</span>
                </div>
              </button>
            </nav>
          </div>

          <!-- 用户信息卡片 -->
          <div class="user-card">
            <div class="user-avatar">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="user-info">
              <h4 class="user-name">{{ authStore.user.username }}</h4>
              <p class="user-role">
                <i class="bi" :class="authStore.isAdmin ? 'bi-shield-check' : 'bi-person'"></i>
                {{ authStore.isAdmin ? '系统管理员' : '普通用户' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-area">
          <div class="content-wrapper">
            <!-- 修改密码部分 -->
            <div v-if="activeSection === 'password'" class="section-content">
              <div class="section-header">
                <div class="section-icon">
                  <i class="bi bi-key"></i>
                </div>
                <div class="section-info">
                  <h2 class="section-title">修改密码</h2>
                  <p class="section-desc">为了账户安全，建议定期更换密码</p>
                </div>
              </div>
              <div class="section-body">
                <ChangePasswordForm />
              </div>
            </div>

            <!-- 用户管理部分 -->
            <div v-if="activeSection === 'users' && authStore.isAdmin" class="section-content">
              <div class="section-header">
                <div class="section-icon">
                  <i class="bi bi-people"></i>
                </div>
                <div class="section-info">
                  <h2 class="section-title">用户管理</h2>
                  <p class="section-desc">管理系统中的所有用户账户</p>
                </div>
              </div>
              <div class="section-body">
                <UserManagement />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import ChangePasswordForm from '@/components/ChangePasswordForm.vue';
import UserManagement from '@/components/UserManagement.vue';

const authStore = useAuthStore();
const activeSection = ref('password'); // 默认显示修改密码

const setActiveSection = (section) => {
  activeSection.value = section;
};
</script>

<style scoped>
.account-view {
  min-height: 100vh;
  position: relative;
  padding: 0;
}

.account-container {
  width: 100%;
  padding: 0;
}

/* 页面标题 */
.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 0 0 20px 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 0 2rem;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

/* 布局 */
.account-layout {
  display: flex;
  gap: 2rem;
  align-items: start;
  padding: 2rem;
}

/* 侧边栏 */
.sidebar {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
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
  background: rgba(102, 126, 234, 0.05);
  border-left: 4px solid #667eea;
}

.nav-icon {
  width: 45px;
  height: 45px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.nav-item.active .nav-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.nav-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-name {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
}

.nav-desc {
  font-size: 0.85rem;
  opacity: 0.7;
  line-height: 1;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
}

.user-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
}

/* 内容区域 */
.content-area {
  flex: 1;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
}

.section-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
}

.section-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.section-desc {
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.section-body {
  flex: 1;
  padding: 2rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    padding: 0 1.5rem;
  }

  .account-layout {
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .sidebar {
    flex: 0 0 300px;
  }
}

@media (max-width: 968px) {
  .account-layout {
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
  }

  .sidebar {
    flex: none;
    order: 2;
  }

  .content-area {
    order: 1;
  }

  .sidebar-content {
    padding: 1.5rem;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }

  .nav-item {
    min-width: 200px;
    flex-shrink: 0;
  }

  .user-card {
    margin-top: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
    border-radius: 0 0 15px 15px;
  }

  .header-content {
    padding: 0 1rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .account-layout {
    padding: 1rem;
  }

  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .section-header {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .section-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .section-body {
    padding: 1.5rem;
  }

  .nav-item {
    min-width: 160px;
  }

  .nav-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }

  .header-content {
    padding: 0 0.75rem;
  }

  .account-layout {
    padding: 0.75rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .sidebar-content {
    padding: 1rem;
  }

  .section-header {
    padding: 1rem;
  }

  .section-body {
    padding: 1rem;
  }

  .user-card {
    padding: 1rem;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

/* 过渡动画 */
.section-content {
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
