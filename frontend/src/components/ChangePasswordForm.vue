<template>
  <div class="password-form-container">
    <!-- 表单头部 -->
    <div class="form-header">
      <div class="header-icon">
        <i class="bi bi-shield-lock"></i>
      </div>
      <div class="header-content">
        <h3 class="form-title">密码安全管理</h3>
        <p class="form-subtitle">定期更新密码可以保护您的账户安全</p>
      </div>
      <div class="security-indicator">
        <div class="indicator-item" :class="passwordStrengthClass">
          <div class="indicator-dot"></div>
          <span>{{ passwordStrengthText }}</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleChangePassword" class="password-form">
      <!-- 当前密码 -->
      <div class="form-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="bi bi-lock"></i>
          </div>
          <div class="section-info">
            <h4 class="section-title">当前密码验证</h4>
            <p class="section-desc">请输入您当前的登录密码进行身份验证</p>
          </div>
        </div>

        <div class="input-group">
          <div class="input-container" :class="{ 'error': errors.currentPassword, 'success': passwordData.currentPassword && !errors.currentPassword }">
            <div class="input-icon">
              <i class="bi bi-key"></i>
            </div>
            <input
              type="password"
              class="form-input"
              id="current-password"
              v-model="passwordData.currentPassword"
              required
              placeholder="输入当前密码"
              @focus="clearError('currentPassword')"
            >
            <div class="input-status">
              <i v-if="errors.currentPassword" class="bi bi-exclamation-circle status-error"></i>
              <i v-else-if="passwordData.currentPassword" class="bi bi-check-circle status-success"></i>
            </div>
          </div>
          <transition name="error">
            <div v-if="errors.currentPassword" class="error-message">
              <i class="bi bi-exclamation-triangle"></i>
              {{ errors.currentPassword }}
            </div>
          </transition>
        </div>
      </div>

      <!-- 新密码 -->
      <div class="form-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="bi bi-key-fill"></i>
          </div>
          <div class="section-info">
            <h4 class="section-title">设置新密码</h4>
            <p class="section-desc">创建一个强密码来保护您的账户</p>
          </div>
        </div>

        <div class="input-group">
          <div class="input-container" :class="{ 'error': errors.newPassword, 'success': passwordData.newPassword && !errors.newPassword && passwordStrength.level !== 'very-weak' }">
            <div class="input-icon">
              <i class="bi bi-shield-lock"></i>
            </div>
            <input
              type="password"
              class="form-input"
              id="new-password"
              v-model="passwordData.newPassword"
              required
              placeholder="输入新密码"
              @input="validatePassword"
              @focus="clearError('newPassword')"
            >
            <div class="input-status">
              <i v-if="errors.newPassword" class="bi bi-exclamation-circle status-error"></i>
              <i v-else-if="passwordData.newPassword && passwordStrength.level === 'strong'" class="bi bi-check-circle status-success"></i>
              <i v-else-if="passwordData.newPassword" class="bi bi-info-circle status-info"></i>
            </div>
          </div>

          <!-- 密码强度指示器 -->
          <transition name="fade">
            <div v-if="passwordData.newPassword" class="password-strength">
              <div class="strength-header">
                <span class="strength-label">密码强度</span>
                <span class="strength-value" :class="passwordStrength.level">{{ passwordStrength.text }}</span>
              </div>
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.level"
                  :style="{ width: `${passwordStrength.percentage}%` }"
                ></div>
              </div>
              <div class="strength-requirements">
                <div class="requirement" :class="{ 'met': passwordData.newPassword.length >= 8 }">
                  <i class="bi" :class="passwordData.newPassword.length >= 8 ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  <span>至少8个字符</span>
                </div>
                <div class="requirement" :class="{ 'met': /[A-Z]/.test(passwordData.newPassword) }">
                  <i class="bi" :class="/[A-Z]/.test(passwordData.newPassword) ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  <span>包含大写字母</span>
                </div>
                <div class="requirement" :class="{ 'met': /[a-z]/.test(passwordData.newPassword) }">
                  <i class="bi" :class="/[a-z]/.test(passwordData.newPassword) ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  <span>包含小写字母</span>
                </div>
                <div class="requirement" :class="{ 'met': hasNumber }">
                  <i class="bi" :class="hasNumber ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  <span>包含数字</span>
                </div>
                <div class="requirement" :class="{ 'met': hasSpecialChar }">
                  <i class="bi" :class="hasSpecialChar ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  <span>包含特殊字符</span>
                </div>
              </div>
            </div>
          </transition>

          <transition name="error">
            <div v-if="errors.newPassword" class="error-message">
              <i class="bi bi-exclamation-triangle"></i>
              {{ errors.newPassword }}
            </div>
          </transition>
        </div>
      </div>

      <!-- 确认密码 -->
      <div class="form-section">
        <div class="section-header">
          <div class="section-icon">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="section-info">
            <h4 class="section-title">确认新密码</h4>
            <p class="section-desc">请再次输入新密码以确认无误</p>
          </div>
        </div>

        <div class="input-group">
          <div class="input-container" :class="{ 'error': errors.confirmPassword, 'success': confirmPassword && passwordData.newPassword === confirmPassword && !errors.confirmPassword }">
            <div class="input-icon">
              <i class="bi bi-check2-circle"></i>
            </div>
            <input
              type="password"
              class="form-input"
              id="confirm-password"
              v-model="confirmPassword"
              required
              placeholder="再次输入新密码"
              @input="validateConfirmPassword"
              @focus="clearError('confirmPassword')"
            >
            <div class="input-status">
              <i v-if="errors.confirmPassword" class="bi bi-exclamation-circle status-error"></i>
              <i v-else-if="confirmPassword && passwordData.newPassword === confirmPassword" class="bi bi-check-circle status-success"></i>
            </div>
          </div>
          <transition name="error">
            <div v-if="errors.confirmPassword" class="error-message">
              <i class="bi bi-exclamation-triangle"></i>
              {{ errors.confirmPassword }}
            </div>
          </transition>
        </div>
      </div>

      <!-- 消息提示 -->
      <transition name="alert">
        <div v-if="successMessage" class="alert success">
          <div class="alert-icon">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="alert-content">
            <h4>密码更新成功</h4>
            <p>{{ successMessage }}</p>
          </div>
        </div>
      </transition>

      <transition name="alert">
        <div v-if="errorMessage" class="alert error">
          <div class="alert-icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div class="alert-content">
            <h4>更新失败</h4>
            <p>{{ errorMessage }}</p>
          </div>
        </div>
      </transition>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <button
          type="submit"
          class="submit-btn"
          :disabled="authStore.isLoading || !isFormValid"
          :class="{ 'loading': authStore.isLoading }"
        >
          <div class="btn-content">
            <div class="btn-icon">
              <i v-if="authStore.isLoading" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-shield-check"></i>
            </div>
            <span class="btn-text">{{ authStore.isLoading ? '正在更新密码...' : '更新密码' }}</span>
          </div>
          <div class="btn-ripple"></div>
        </button>

        <div class="form-help">
          <i class="bi bi-info-circle"></i>
          <span>密码更新后，所有设备上的会话将自动注销</span>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const passwordData = reactive({
  currentPassword: '',
  newPassword: ''
});

const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 清除错误信息
const clearError = (field) => {
  errors[field] = '';
  if (field === 'currentPassword') {
    errorMessage.value = '';
  }
};

// 密码强度计算
const passwordStrength = computed(() => {
  const password = passwordData.newPassword;
  if (!password) return { level: 'none', percentage: 0, text: '无' };

  let score = 0;

  // 长度检查
  if (password.length >= 12) score += 30;
  else if (password.length >= 8) score += 20;
  else if (password.length >= 6) score += 10;

  // 包含小写字母
  if (/[a-z]/.test(password)) score += 15;

  // 包含大写字母
  if (/[A-Z]/.test(password)) score += 15;

  // 包含数字
  if (/\d/.test(password)) score += 15;

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

  // 没有重复字符
  if (!/(.)\1{2,}/.test(password)) score += 10;

  let level, text;
  if (score >= 85) {
    level = 'strong';
    text = '强';
  } else if (score >= 65) {
    level = 'medium';
    text = '中等';
  } else if (score >= 40) {
    level = 'weak';
    text = '弱';
  } else {
    level = 'very-weak';
    text = '很弱';
  }

  return { level, percentage: Math.min(score, 100), text };
});

// 密码强度样式类
const passwordStrengthClass = computed(() => {
  if (!passwordData.newPassword) return 'neutral';
  return passwordStrength.value.level;
});

const passwordStrengthText = computed(() => {
  if (!passwordData.newPassword) return '待设置';
  return `强度：${passwordStrength.value.text}`;
});

// 密码要求检查
const hasNumber = computed(() => /\d/.test(passwordData.newPassword));
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword));

// 表单验证
const isFormValid = computed(() => {
  return passwordData.currentPassword &&
         passwordData.newPassword &&
         confirmPassword.value &&
         passwordData.newPassword === confirmPassword.value &&
         passwordData.newPassword.length >= 6 &&
         !Object.values(errors).some(error => error);
});

// 验证新密码
const validatePassword = () => {
  errors.newPassword = '';
  if (passwordData.newPassword && passwordData.newPassword.length < 6) {
    errors.newPassword = '密码长度不能少于6个字符';
  }
  validateConfirmPassword();
};

// 验证确认密码
const validateConfirmPassword = () => {
  errors.confirmPassword = '';
  if (confirmPassword.value && passwordData.newPassword !== confirmPassword.value) {
    errors.confirmPassword = '两次输入的密码不一致';
  }
};

// 处理密码修改
const handleChangePassword = async () => {
  // 清除之前的消息
  successMessage.value = '';
  errorMessage.value = '';

  // 重新验证
  validatePassword();
  validateConfirmPassword();

  if (!isFormValid.value) {
    errorMessage.value = '请检查表单输入是否正确';
    return;
  }

  try {
    const result = await authStore.changePassword(passwordData);
    successMessage.value = result.message || '密码修改成功！为了安全，请重新登录。';

    // 清空表单
    setTimeout(() => {
      passwordData.currentPassword = '';
      passwordData.newPassword = '';
      confirmPassword.value = '';

      // 清除错误信息
      Object.keys(errors).forEach(key => errors[key] = '');
    }, 2000);

  } catch (error) {
    errorMessage.value = error.message || '密码修改失败，请检查当前密码是否正确';
    errors.currentPassword = '当前密码验证失败';
  }
};
</script>

<style scoped>
.password-form-container {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

/* ===== 表单头部 ===== */
.form-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 2rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.form-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
}

.header-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  z-index: 2;
}

.header-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-subtitle {
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
}

.security-indicator {
  position: relative;
  z-index: 2;
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  font-weight: 600;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

.indicator-item.strong { color: #10b981; }
.indicator-item.medium { color: #f59e0b; }
.indicator-item.weak { color: #ef4444; }
.indicator-item.very-weak { color: #dc2626; }
.indicator-item.neutral { color: #cbd5e1; }

/* ===== 表单内容 ===== */
.password-form {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
}

.form-section:last-of-type {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.section-desc {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* ===== 输入组件 ===== */
.input-group {
  position: relative;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.input-container:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.input-container.success {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02), transparent);
}

.input-container.error {
  border-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), transparent);
}

.input-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.input-container.success .input-icon {
  color: #10b981;
}

.input-container.error .input-icon {
  color: #ef4444;
}

.form-input {
  flex: 1;
  padding: 1rem 0;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: #1e293b;
}

.form-input::placeholder {
  color: #94a3b8;
}

.input-status {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.status-success {
  color: #10b981;
  animation: checkmark 0.3s ease-in-out;
}

.status-error {
  color: #ef4444;
  animation: shake 0.3s ease-in-out;
}

.status-info {
  color: #3b82f6;
}

/* ===== 密码强度指示器 ===== */
.password-strength {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.strength-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.strength-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.strength-value {
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
}

.strength-value.strong {
  background: #dcfce7;
  color: #15803d;
}

.strength-value.medium {
  background: #fef3c7;
  color: #d97706;
}

.strength-value.weak {
  background: #fee2e2;
  color: #dc2626;
}

.strength-value.very-weak {
  background: #fecaca;
  color: #b91c1c;
}

.strength-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.strength-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.strength-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

.strength-fill.strong {
  background: linear-gradient(135deg, #10b981, #059669);
}

.strength-fill.medium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.strength-fill.weak {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.strength-fill.very-weak {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.strength-requirements {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  transition: all 0.3s ease;
}

.requirement.met {
  color: #10b981;
}

.requirement i {
  font-size: 1rem;
}

/* ===== 错误消息 ===== */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: #dc2626;
  border-radius: 0.75rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.9rem;
  font-weight: 500;
}

/* ===== 消息提示 ===== */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid;
}

.alert.success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
  color: #065f46;
  border-color: rgba(16, 185, 129, 0.2);
}

.alert.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: #7f1d1d;
  border-color: rgba(239, 68, 68, 0.2);
}

.alert-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.alert-content h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.alert-content p {
  margin: 0;
  opacity: 0.9;
}

/* ===== 表单操作区 ===== */
.form-actions {
  border-top: 1px solid #e2e8f0;
  padding-top: 2rem;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  margin-bottom: 1rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.submit-btn.loading {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
}

.btn-icon {
  font-size: 1.25rem;
}

.btn-text {
  font-weight: 600;
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

.submit-btn:active:not(:disabled) .btn-ripple {
  opacity: 1;
  transform: scale(1);
}

.form-help {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;
  text-align: center;
}

.form-help i {
  color: #94a3b8;
}

/* ===== 动画效果 ===== */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
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

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

/* ===== 过渡动画 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.error-enter-active,
.error-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
  .form-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .security-indicator {
    width: 100%;
  }

  .indicator-item {
    justify-content: center;
  }

  .password-form {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .strength-requirements {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .form-header {
    padding: 1.5rem;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }

  .form-title {
    font-size: 1.25rem;
  }

  .password-form {
    padding: 1rem;
  }

  .form-section {
    margin-bottom: 2rem;
  }

  .section-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .input-container {
    border-radius: 0.75rem;
  }

  .input-icon,
  .input-status {
    width: 40px;
    height: 40px;
  }

  .submit-btn {
    padding: 0.875rem 1.5rem;
  }
}

/* ===== 暗色模式支持 ===== */
@media (prefers-color-scheme: dark) {
  .password-form-container {
    background: linear-gradient(135deg, #1e293b, #334155);
    border-color: #475569;
  }

  .section-title {
    color: #f1f5f9;
  }

  .section-desc {
    color: #cbd5e1;
  }

  .input-container {
    background: #334155;
    border-color: #475569;
  }

  .form-input {
    color: #f1f5f9;
  }

  .form-input::placeholder {
    color: #64748b;
  }

  .password-strength {
    background: linear-gradient(135deg, #334155, #475569);
    border-color: #64748b;
  }

  .strength-label {
    color: #cbd5e1;
  }

  .requirement {
    color: #94a3b8;
  }

  .form-help {
    color: #94a3b8;
  }
}
</style>
