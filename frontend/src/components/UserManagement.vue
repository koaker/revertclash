<template>
  <div class="user-management">
    <!-- 头部操作区 -->
    <div class="management-header">
      <div class="header-info">
        <h3 class="header-title">
          <i class="bi bi-people"></i>
          用户列表
        </h3>
        <p class="header-desc">系统中共有 {{ store.users.length }} 位用户</p>
      </div>
      <button class="add-user-btn" @click="openAddUserModal">
        <div class="btn-content">
          <i class="bi bi-person-plus"></i>
          <span>添加用户</span>
        </div>
        <div class="btn-ripple"></div>
      </button>
    </div>

    <!-- 加载和错误状态 -->
    <div v-if="store.isLoading" class="loading-state">
      <div class="loading-spinner">
        <i class="bi bi-arrow-repeat spin"></i>
      </div>
      <p>正在加载用户数据...</p>
    </div>

    <div v-if="store.error" class="error-state">
      <div class="error-icon">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <p class="error-message">{{ store.error }}</p>
      <button class="retry-btn" @click="store.fetchUsers()">
        <i class="bi bi-arrow-clockwise"></i>
        重新加载
      </button>
    </div>

    <!-- 用户列表 -->
    <div v-if="!store.isLoading && !store.error && store.users.length > 0" class="users-container">
      <div class="users-grid">
        <div v-for="user in store.users" :key="user.id" class="user-card">
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="user-info">
            <h4 class="user-name">{{ user.username }}</h4>
            <div class="user-meta">
              <span class="user-role" :class="{ 'role-admin': user.isAdmin }">
                <i class="bi" :class="user.isAdmin ? 'bi-shield-check' : 'bi-person'"></i>
                {{ user.isAdmin ? '管理员' : '普通用户' }}
              </span>
              <span class="user-date">
                <i class="bi bi-calendar-plus"></i>
                {{ formatDate(user.createdAt) }}
              </span>
            </div>
          </div>
          <div class="user-actions">
            <button
              class="action-btn delete-btn"
              @click="handleDeleteUser(user.id)"
              :disabled="isSelf(user.id)"
              :title="isSelf(user.id) ? '不能删除自己' : '删除用户'"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 备用表格视图 -->
      <div class="table-view">
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>
                  <i class="bi bi-person"></i>
                  用户
                </th>
                <th>
                  <i class="bi bi-shield"></i>
                  角色
                </th>
                <th>
                  <i class="bi bi-calendar"></i>
                  创建时间
                </th>
                <th>
                  <i class="bi bi-gear"></i>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in store.users" :key="user.id" class="user-row">
                <td class="user-cell">
                  <div class="user-display">
                    <div class="user-avatar small">
                      <i class="bi bi-person-circle"></i>
                    </div>
                    <span class="user-name">{{ user.username }}</span>
                  </div>
                </td>
                <td class="role-cell">
                  <span class="role-badge" :class="{ 'role-admin': user.isAdmin }">
                    <i class="bi" :class="user.isAdmin ? 'bi-shield-check' : 'bi-person'"></i>
                    {{ user.isAdmin ? '管理员' : '普通用户' }}
                  </span>
                </td>
                <td class="date-cell">
                  <span class="date-text">{{ formatDate(user.createdAt) }}</span>
                </td>
                <td class="actions-cell">
                  <button
                    class="action-btn delete-btn"
                    @click="handleDeleteUser(user.id)"
                    :disabled="isSelf(user.id)"
                    :title="isSelf(user.id) ? '不能删除自己' : '删除用户'"
                  >
                    <i class="bi bi-trash"></i>
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!store.isLoading && !store.error && store.users.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="bi bi-people"></i>
      </div>
      <h3 class="empty-title">暂无用户</h3>
      <p class="empty-desc">系统中还没有任何用户，点击上方按钮添加第一个用户</p>
    </div>

    <!-- 添加用户模态框 -->
    <div class="modal-overlay" :class="{ active: showModal }" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="bi bi-person-plus"></i>
            添加新用户
          </h3>
          <button class="modal-close" @click="closeModal">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleCreateUser" class="add-user-form">
            <div class="form-group">
              <label for="new-username" class="form-label">
                <i class="bi bi-person"></i>
                用户名
              </label>
              <div class="input-wrapper">
                <input
                  type="text"
                  class="form-input"
                  id="new-username"
                  v-model="newUser.username"
                  required
                  :class="{ 'has-error': formErrors.username }"
                  placeholder="请输入用户名"
                  @input="validateUsername"
                >
                <div class="input-border"></div>
              </div>
              <div v-if="formErrors.username" class="form-error">
                {{ formErrors.username }}
              </div>
            </div>

            <div class="form-group">
              <label for="add-new-password" class="form-label">
                <i class="bi bi-key"></i>
                密码
              </label>
              <div class="input-wrapper">
                <input
                  type="password"
                  class="form-input"
                  id="add-new-password"
                  v-model="newUser.password"
                  required
                  :class="{ 'has-error': formErrors.password }"
                  placeholder="请输入密码"
                  @input="validatePassword"
                >
                <div class="input-border"></div>
              </div>
              <div class="form-help">
                <i class="bi bi-info-circle"></i>
                密码长度至少6个字符
              </div>
              <div v-if="formErrors.password" class="form-error">
                {{ formErrors.password }}
              </div>
            </div>

            <div class="form-group">
              <div class="checkbox-wrapper">
                <input
                  class="form-checkbox"
                  type="checkbox"
                  id="isAdmin"
                  v-model="newUser.isAdmin"
                >
                <label class="checkbox-label" for="isAdmin">
                  <div class="checkbox-indicator">
                    <i class="bi bi-check"></i>
                  </div>
                  <div class="checkbox-text">
                    <span class="checkbox-title">管理员权限</span>
                    <span class="checkbox-desc">拥有系统管理权限</span>
                  </div>
                </label>
              </div>
            </div>

            <div v-if="creationError" class="alert alert-error">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ creationError }}
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">
            <i class="bi bi-x-circle"></i>
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleCreateUser"
            :disabled="store.isLoading || !isFormValid"
            :class="{ 'loading': store.isLoading }"
          >
            <div class="btn-content">
              <i v-if="store.isLoading" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-check-circle"></i>
              <span>{{ store.isLoading ? '添加中...' : '添加用户' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useAuthStore } from '@/stores/authStore';

const store = useUserManagementStore();
const authStore = useAuthStore();

const showModal = ref(false);

const newUser = reactive({
  username: '',
  password: '',
  isAdmin: false
});

const formErrors = reactive({
  username: '',
  password: ''
});

const creationError = ref(null);

onMounted(() => {
  store.fetchUsers();
});

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 检查是否是当前用户
const isSelf = (userId) => {
  return authStore.user?.id === userId;
};

// 表单验证
const isFormValid = computed(() => {
  return newUser.username &&
         newUser.password &&
         newUser.password.length >= 6 &&
         !Object.values(formErrors).some(error => error);
});

// 验证用户名
const validateUsername = () => {
  formErrors.username = '';
  if (newUser.username && newUser.username.length < 3) {
    formErrors.username = '用户名至少3个字符';
  }
};

// 验证密码
const validatePassword = () => {
  formErrors.password = '';
  if (newUser.password && newUser.password.length < 6) {
    formErrors.password = '密码长度至少6个字符';
  }
};

// 删除用户
const handleDeleteUser = async (userId) => {
  if (isSelf(userId)) {
    return;
  }

  // 使用自定义确认对话框的样式
  const confirmed = confirm('确定要删除此用户吗？此操作无法撤销。');
  if (confirmed) {
    try {
      await store.deleteUser(userId);
    } catch (error) {
      alert(error.message || '删除失败');
    }
  }
};

// 打开添加用户模态框
const openAddUserModal = () => {
  newUser.username = '';
  newUser.password = '';
  newUser.isAdmin = false;
  creationError.value = null;
  Object.keys(formErrors).forEach(key => formErrors[key] = '');
  showModal.value = true;
};

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
};

// 创建用户
const handleCreateUser = async () => {
  creationError.value = null;

  // 重新验证
  validateUsername();
  validatePassword();

  if (!isFormValid.value) {
    creationError.value = '请检查表单输入';
    return;
  }

  try {
    await store.addUser({ ...newUser });
    closeModal();
  } catch (error) {
    creationError.value = error.message || '添加用户失败';
  }
};
</script>

<style scoped>
.user-management {
  --primary-color: #6366f1;
  --primary-light: #a5b4fc;
  --primary-dark: #4f46e5;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-tertiary: #f1f5f9;
  --surface-quaternary: #e2e8f0;

  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;

  --border-color: #e2e8f0;
  --border-focus: var(--primary-color);

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* ===== 头部操作区 ===== */
.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--border-color);
}

.header-info {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.header-title i {
  color: var(--primary-color);
}

.header-desc {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.add-user-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.add-user-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.add-user-btn:active {
  transform: translateY(0);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  z-index: 2;
}

.btn-ripple {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-user-btn:active .btn-ripple {
  opacity: 1;
  transform: scale(1);
}

/* ===== 状态显示 ===== */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.loading-spinner, .error-icon, .empty-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
}

.error-icon {
  background: linear-gradient(135deg, var(--error-color), #dc2626);
}

.loading-state p, .empty-desc {
  color: var(--text-secondary);
  margin: 0;
}

.error-message {
  color: var(--error-color);
  margin: 0 0 var(--spacing-lg) 0;
  font-weight: 500;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.retry-btn {
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.retry-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* ===== 用户卡片网格 ===== */
.users-container {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.user-card {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover::before {
  opacity: 1;
}

.user-card .user-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.user-info .user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.user-role, .user-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.user-role.role-admin {
  color: var(--primary-color);
  font-weight: 600;
}

.user-actions {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs);
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.action-btn:hover:not(:disabled) {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
  transform: scale(1.1);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ===== 表格视图 ===== */
.table-view {
  display: none;
}

.table-container {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: linear-gradient(135deg, var(--surface-secondary), var(--surface-tertiary));
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

.users-table th i {
  margin-right: var(--spacing-xs);
  color: var(--primary-color);
}

.user-row {
  transition: all 0.3s ease;
}

.user-row:hover {
  background: var(--surface-secondary);
}

.users-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.user-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar.small {
  width: 40px;
  height: 40px;
  font-size: 1.25rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--surface-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.role-badge.role-admin {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
  color: var(--primary-color);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.date-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.actions-cell .action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
}

/* ===== 模态框 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal-container {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  transform: scale(0.9) translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.active .modal-container {
  transform: scale(1) translateY(0);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--surface-secondary), var(--surface-tertiary));
}

.modal-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-title i {
  color: var(--primary-color);
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--surface-quaternary);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-xl);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  background: var(--surface-secondary);
}

/* ===== 表单样式 ===== */
.add-user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-label i {
  color: var(--primary-color);
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--surface-primary);
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--text-tertiary);
}

.form-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input.has-error {
  border-color: var(--error-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  background-clip: padding-box;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.form-input:focus + .input-border {
  opacity: 0.1;
}

.form-help {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.form-help i {
  color: var(--primary-color);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--error-color);
  font-weight: 500;
}

.form-error::before {
  content: '⚠';
}

/* ===== 复选框样式 ===== */
.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.form-checkbox {
  display: none;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.checkbox-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox-indicator i {
  color: white;
  font-size: 0.8rem;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-checkbox:checked + .checkbox-label .checkbox-indicator {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-color: var(--primary-color);
}

.form-checkbox:checked + .checkbox-label .checkbox-indicator i {
  opacity: 1;
  transform: scale(1);
}

.checkbox-text {
  flex: 1;
}

.checkbox-title {
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 2px;
}

.checkbox-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: block;
}

/* ===== 按钮样式 ===== */
.btn {
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--surface-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--surface-quaternary);
  color: var(--text-primary);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn.loading {
  background: linear-gradient(135deg, var(--text-tertiary), var(--text-secondary));
}

/* ===== 消息提示 ===== */
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: var(--error-color);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ===== 动画效果 ===== */
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

/* ===== 响应式设计 ===== */
@media (max-width: 1024px) {
  .users-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-lg);
  }

  .users-grid {
    display: none;
  }

  .table-view {
    display: block;
  }

  .users-table th,
  .users-table td {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .modal-container {
    width: 95vw;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--spacing-lg);
  }

  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .users-table {
    font-size: 0.9rem;
  }

  .users-table th,
  .users-table td {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .user-display {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-xs);
  }

  .user-avatar.small {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .actions-cell .action-btn {
    padding: var(--spacing-xs);
  }

  .actions-cell .action-btn span {
    display: none;
  }
}

/* ===== 暗色模式支持 ===== */
@media (prefers-color-scheme: dark) {
  .user-management {
    --surface-primary: #1e293b;
    --surface-secondary: #334155;
    --surface-tertiary: #475569;
    --surface-quaternary: #64748b;

    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;

    --border-color: #374151;
  }
}
</style>
