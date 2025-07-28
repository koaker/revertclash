<template>
  <div class="login-page">
    <div class="login-background">
      <!-- 背景装饰 -->
      <div class="bg-decoration">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- 登录卡片 -->
      <div class="login-container">
        <div class="login-card">
          <!-- 品牌标识 -->
          <div class="brand-section">
            <div class="brand-logo">
              <i class="bi bi-shield-check"></i>
            </div>
            <h1 class="brand-title">RevertClash</h1>
            <p class="brand-subtitle">代理管理平台</p>
          </div>

          <!-- 登录表单 -->
          <div class="login-form-section">
            <div class="form-header">
              <h2 class="form-title">欢迎回来</h2>
              <p class="form-subtitle">请输入您的账户信息</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <!-- 用户名输入框 -->
              <div class="form-group">
                <label for="username" class="form-label">
                  <i class="bi bi-person"></i>
                  用户名
                </label>
                <div class="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    class="form-input"
                    :class="{ 'error': authStore.authError }"
                    v-model="username"
                    placeholder="请输入用户名"
                    required
                    autocomplete="username"
                  />
                  <div class="input-icon">
                    <i class="bi bi-person"></i>
                  </div>
                </div>
              </div>

              <!-- 密码输入框 -->
              <div class="form-group">
                <label for="password" class="form-label">
                  <i class="bi bi-lock"></i>
                  密码
                </label>
                <div class="input-wrapper">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    id="password"
                    class="form-input"
                    :class="{ 'error': authStore.authError }"
                    v-model="password"
                    placeholder="请输入密码"
                    required
                    autocomplete="current-password"
                  />
                  <div class="input-icon">
                    <i class="bi bi-lock"></i>
                  </div>
                  <button
                    type="button"
                    class="password-toggle"
                    @click="togglePasswordVisibility"
                    :title="showPassword ? '隐藏密码' : '显示密码'"
                  >
                    <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- 错误信息显示 -->
              <div v-if="authStore.authError" class="error-message">
                <i class="bi bi-exclamation-triangle"></i>
                <span>{{ authStore.authError }}</span>
              </div>

              <!-- 记住我选项 -->
              <div class="form-options">
                <label class="checkbox-wrapper">
                  <input type="checkbox" v-model="rememberMe">
                  <span class="checkmark"></span>
                  <span class="checkbox-text">记住我</span>
                </label>
              </div>

              <!-- 登录按钮 -->
              <button
                type="submit"
                class="login-button"
                :disabled="authStore.isLoading || !isFormValid"
                :class="{ 'loading': authStore.isLoading }"
              >
                <div class="button-content">
                  <div v-if="authStore.isLoading" class="button-spinner">
                    <div class="spinner"></div>
                  </div>
                  <i v-else class="bi bi-box-arrow-in-right"></i>
                  <span>{{ authStore.isLoading ? '登录中...' : '登录' }}</span>
                </div>
              </button>
            </form>
          </div>

          <!-- 页脚信息 -->
          <div class="login-footer">
            <p class="footer-text">
              <i class="bi bi-shield-check"></i>
              安全的代理管理平台
            </p>
          </div>
        </div>

        <!-- 功能特色 -->
        <div class="features-section">
          <h3 class="features-title">为什么选择 RevertClash？</h3>
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">
                <i class="bi bi-lightning"></i>
              </div>
              <div class="feature-content">
                <h4>高性能</h4>
                <p>优化的代理管理，快速稳定的连接</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <div class="feature-content">
                <h4>安全可靠</h4>
                <p>企业级安全保护，数据加密传输</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class="bi bi-gear-wide-connected"></i>
              </div>
              <div class="feature-content">
                <h4>易于管理</h4>
                <p>直观的管理界面，简化复杂配置</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore';
import { ref, computed } from 'vue';

// 获取 auth store 实例
const authStore = useAuthStore();

// 创建响应式变量来绑定表单输入
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);

// 计算表单是否有效
const isFormValid = computed(() => {
  return username.value.trim() && password.value.trim();
});

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 定义处理登录的函数
const handleLogin = async () => {
  if (isFormValid.value) {
    // 调用 store 中的 login action
    await authStore.login(username.value, password.value);

    // 如果选择了记住我，可以在这里处理相关逻辑
    if (rememberMe.value) {
      // TODO: 实现记住我功能
      console.log('用户选择了记住我');
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: relative;
  width: 100%;
  max-width: 1200px;
  z-index: 1;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 登录容器 */
.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 登录卡片 */
.login-card {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-bottom: 1rem;
}

.brand-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

/* 表单区域 */
.login-form-section {
  flex: 1;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

/* 输入框容器 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-input.error {
  border-color: #e74c3c;
  box-shadow: 0 0 0 0.2rem rgba(231, 76, 60, 0.25);
}

.form-input::placeholder {
  color: #adb5bd;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #adb5bd;
  font-size: 1.1rem;
  pointer-events: none;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #adb5bd;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

/* 错误信息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border-radius: 8px;
  font-size: 0.9rem;
  border-left: 4px solid #e74c3c;
}

/* 表单选项 */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #555;
}

.checkbox-wrapper input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkmark {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: #667eea;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.button-spinner {
  display: flex;
  align-items: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 登录页脚 */
.login-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

/* 功能特色区域 */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.features-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 1rem;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.feature-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.feature-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.feature-content p {
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding: 2.5rem;
  }

  .features-section {
    order: -1;
  }

  .features-list {
    flex-direction: row;
    justify-content: space-around;
  }

  .feature-item {
    flex: 1;
    text-align: center;
    flex-direction: column;
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 1rem;
  }

  .login-container {
    padding: 2rem;
    gap: 2rem;
  }

  .brand-logo {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .brand-title {
    font-size: 2rem;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .features-list {
    flex-direction: column;
  }

  .feature-item {
    flex-direction: row;
    text-align: left;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 1.5rem;
  }

  .brand-logo {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .brand-title {
    font-size: 1.75rem;
  }

  .form-input {
    padding: 0.875rem 0.875rem 0.875rem 2.5rem;
  }

  .input-icon {
    left: 0.875rem;
  }

  .password-toggle {
    right: 0.875rem;
  }
}
</style>
