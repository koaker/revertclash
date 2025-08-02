<template>
  <div class="account-view">
    <!-- 顶部用户档案区域 -->
    <div class="user-profile-section">
      <div class="profile-container">
        <!-- 用户头像和基本信息 -->
        <div class="user-profile-card">
          <div class="profile-header">
            <div class="avatar-container">
              <div class="user-avatar">
                <i class="bi bi-person-circle"></i>
                <div class="avatar-badge" :class="{ 'admin': authStore.isAdmin }">
                  <i class="bi" :class="authStore.isAdmin ? 'bi-shield-check' : 'bi-person'"></i>
                </div>
              </div>
              <div class="avatar-glow"></div>
            </div>
            <div class="profile-info">
              <h1 class="user-name">{{ authStore.user.username }}</h1>
              <div class="user-role">
                <span class="role-badge" :class="{ 'admin': authStore.isAdmin }">
                  <i class="bi" :class="authStore.isAdmin ? 'bi-shield-check' : 'bi-person'"></i>
                  {{ authStore.isAdmin ? '系统管理员' : '普通用户' }}
                </span>
              </div>
              <div class="user-stats">
                <div class="stat-item">
                  <i class="bi bi-clock"></i>
                  <span>最后登录：今天 14:32</span>
                </div>
                <div class="stat-item">
                  <i class="bi bi-calendar-check"></i>
                  <span>注册时间：2024年1月</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速状态指示器 -->
          <div class="status-indicators">
            <div class="status-item active">
              <div class="status-dot"></div>
              <span>账户正常</span>
            </div>
            <div class="status-item">
              <div class="status-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <span>安全验证</span>
            </div>
          </div>
        </div>

        <!-- 账户概览统计 -->
        <div class="account-overview">
          <div class="overview-card">
            <div class="overview-icon">
              <i class="bi bi-key"></i>
            </div>
            <div class="overview-content">
              <h3>密码安全</h3>
              <p class="overview-value">强度：中等</p>
              <p class="overview-desc">90天前更新</p>
            </div>
            <div class="overview-action">
              <button class="action-btn" @click="setActiveModule('password')">
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          <div class="overview-card" v-if="authStore.isAdmin">
            <div class="overview-icon admin">
              <i class="bi bi-people"></i>
            </div>
            <div class="overview-content">
              <h3>用户管理</h3>
              <p class="overview-value">5 位用户</p>
              <p class="overview-desc">管理系统用户</p>
            </div>
            <div class="overview-action">
              <button class="action-btn" @click="setActiveModule('users')">
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          <div class="overview-card">
            <div class="overview-icon">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="overview-content">
              <h3>使用统计</h3>
              <p class="overview-value">24小时活跃</p>
              <p class="overview-desc">登录120次</p>
            </div>
            <div class="overview-action">
              <button class="action-btn">
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="main-content">
      <div class="content-container">
        <!-- 功能模块网格 -->
        <div class="modules-grid">
          <!-- 修改密码模块 -->
          <div class="module-card" :class="{ 'active': activeModule === 'password' }">
            <div class="module-header">
              <div class="module-icon">
                <i class="bi bi-key"></i>
              </div>
              <div class="module-info">
                <h2 class="module-title">修改密码</h2>
                <p class="module-desc">更新您的登录密码，保护账户安全</p>
              </div>
              <div class="module-toggle">
                <button
                  class="toggle-btn"
                  @click="toggleModule('password')"
                  :class="{ 'active': activeModule === 'password' }"
                >
                  <i class="bi" :class="activeModule === 'password' ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                </button>
              </div>
            </div>

            <transition name="module-content">
              <div v-if="activeModule === 'password'" class="module-content">
                <ChangePasswordForm />
              </div>
            </transition>
          </div>

          <!-- 用户管理模块 -->
          <div
            v-if="authStore.isAdmin"
            class="module-card"
            :class="{ 'active': activeModule === 'users' }"
          >
            <div class="module-header">
              <div class="module-icon admin">
                <i class="bi bi-people"></i>
              </div>
              <div class="module-info">
                <h2 class="module-title">用户管理</h2>
                <p class="module-desc">管理系统中的所有用户账户和权限</p>
              </div>
              <div class="module-toggle">
                <button
                  class="toggle-btn"
                  @click="toggleModule('users')"
                  :class="{ 'active': activeModule === 'users' }"
                >
                  <i class="bi" :class="activeModule === 'users' ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                </button>
              </div>
            </div>

            <transition name="module-content">
              <div v-if="activeModule === 'users'" class="module-content">
                <UserManagement />
              </div>
            </transition>
          </div>

          <!-- 安全设置模块 -->
          <div class="module-card" :class="{ 'active': activeModule === 'security' }">
            <div class="module-header">
              <div class="module-icon security">
                <i class="bi bi-shield-lock"></i>
              </div>
              <div class="module-info">
                <h2 class="module-title">安全设置</h2>
                <p class="module-desc">管理登录安全、两步验证等安全选项</p>
              </div>
              <div class="module-toggle">
                <button
                  class="toggle-btn"
                  @click="toggleModule('security')"
                  :class="{ 'active': activeModule === 'security' }"
                >
                  <i class="bi" :class="activeModule === 'security' ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                </button>
              </div>
            </div>

            <transition name="module-content">
              <div v-if="activeModule === 'security'" class="module-content">
                <div class="security-options">
                  <div class="security-item">
                    <div class="security-icon">
                      <i class="bi bi-phone"></i>
                    </div>
                    <div class="security-info">
                      <h4>两步验证</h4>
                      <p>通过手机或邮箱验证增强账户安全</p>
                    </div>
                    <div class="security-action">
                      <label class="switch">
                        <input type="checkbox" v-model="twoFactorEnabled">
                        <span class="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="security-item">
                    <div class="security-icon">
                      <i class="bi bi-clock-history"></i>
                    </div>
                    <div class="security-info">
                      <h4>会话管理</h4>
                      <p>查看和管理活跃的登录会话</p>
                    </div>
                    <div class="security-action">
                      <button class="btn-outline">查看会话</button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="activity-section">
          <div class="activity-header">
            <h3>最近活动</h3>
            <button class="view-all-btn">查看全部</button>
          </div>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">
                <i class="bi bi-box-arrow-in-right"></i>
              </div>
              <div class="activity-content">
                <h4>成功登录</h4>
                <p>从 192.168.1.100 登录</p>
                <span class="activity-time">2分钟前</span>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon">
                <i class="bi bi-key"></i>
              </div>
              <div class="activity-content">
                <h4>密码更新</h4>
                <p>密码安全强度提升</p>
                <span class="activity-time">3天前</span>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon">
                <i class="bi bi-person-plus"></i>
              </div>
              <div class="activity-content">
                <h4>新用户注册</h4>
                <p>用户 "testuser" 已注册</p>
                <span class="activity-time">1周前</span>
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
const activeModule = ref(null);
const twoFactorEnabled = ref(false);

const setActiveModule = (module) => {
  activeModule.value = activeModule.value === module ? null : module;
};

const toggleModule = (module) => {
  activeModule.value = activeModule.value === module ? null : module;
};
</script>

<style scoped>
.account-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
}

/* ===== 用户档案区域 ===== */
.user-profile-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3rem 2rem 2rem;
  position: relative;
  overflow: hidden;
}

.user-profile-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.user-profile-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 2rem;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.user-profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.avatar-container {
  position: relative;
}

.user-avatar {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
  position: relative;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.2);
}

.avatar-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-badge.admin {
  background: #f59e0b;
}

.avatar-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  border-radius: 50%;
  filter: blur(20px);
  z-index: -1;
  animation: pulse 3s ease-in-out infinite;
}

.profile-info {
  flex: 1;
}

.user-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #1e293b, #475569);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #475569;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.role-badge.admin {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.stat-item i {
  color: #667eea;
}

.status-indicators {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.status-item.active {
  color: #10b981;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-icon {
  color: #667eea;
}

/* ===== 账户概览 ===== */
.account-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.overview-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.overview-icon.admin {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.overview-content {
  flex: 1;
}

.overview-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.overview-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
  margin: 0 0 0.25rem 0;
}

.overview-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.action-btn {
  width: 40px;
  height: 40px;
  background: rgba(102, 126, 234, 0.1);
  border: none;
  border-radius: 50%;
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

/* ===== 主要内容区域 ===== */
.main-content {
  padding: 2rem;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

/* ===== 功能模块 ===== */
.modules-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.module-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.module-card.active {
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.module-header {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.module-header:hover {
  background: #f8fafc;
}

.module-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-right: 1rem;
}

.module-icon.admin {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.module-icon.security {
  background: linear-gradient(135deg, #10b981, #059669);
}

.module-info {
  flex: 1;
}

.module-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.module-desc {
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover,
.toggle-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.module-content {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

/* ===== 模块内容过渡动画 ===== */
.module-content-enter-active,
.module-content-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.module-content-enter-from,
.module-content-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.module-content-enter-to,
.module-content-leave-from {
  opacity: 1;
  max-height: 1000px;
}

/* ===== 安全设置 ===== */
.security-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.security-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.security-info {
  flex: 1;
}

.security-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.security-info p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #667eea;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.btn-outline {
  background: transparent;
  border: 2px solid #667eea;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

/* ===== 活动区域 ===== */
.activity-section {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  height: fit-content;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.activity-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.view-all-btn {
  background: transparent;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.activity-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.activity-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.activity-content p {
  color: #64748b;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
}

.activity-time {
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ===== 动画效果 ===== */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* ===== 响应式设计 ===== */
@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .account-overview {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .user-profile-section {
    padding: 2rem 1rem 1rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .user-avatar {
    width: 100px;
    height: 100px;
    font-size: 3rem;
  }

  .user-name {
    font-size: 2rem;
  }

  .user-stats {
    align-items: center;
  }

  .status-indicators {
    justify-content: center;
  }

  .account-overview {
    grid-template-columns: 1fr;
  }

  .main-content {
    padding: 1rem;
  }

  .module-header {
    padding: 1rem;
  }

  .module-content {
    padding: 0 1rem 1rem;
  }
}

@media (max-width: 480px) {
  .user-profile-card {
    padding: 1.5rem;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
    font-size: 2.5rem;
  }

  .user-name {
    font-size: 1.75rem;
  }

  .overview-card {
    padding: 1rem;
  }

  .module-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .module-icon {
    margin-right: 0;
  }

  .toggle-btn {
    align-self: flex-end;
  }
}

/* ===== 暗色模式支持 ===== */
@media (prefers-color-scheme: dark) {
  .account-view {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  .user-profile-card,
  .overview-card,
  .module-card,
  .activity-section {
    background: #1e293b;
    border-color: #334155;
    color: #f1f5f9;
  }

  .user-name {
    color: #f1f5f9;
    background: linear-gradient(135deg, #f1f5f9, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .module-title,
  .activity-content h4 {
    color: #f1f5f9;
  }

  .module-desc,
  .overview-desc,
  .activity-content p,
  .stat-item,
  .status-item {
    color: #cbd5e1;
  }

  .security-item,
  .activity-item {
    background: #334155;
    border-color: #475569;
  }

  .module-header:hover {
    background: #334155;
  }
}
</style>
