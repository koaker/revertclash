<template>
  <div class="setup-container">
    <div class="setup-card">
      <!-- Header -->
      <div class="setup-header">
        <div class="setup-logo">
          <i class="bi bi-gear-fill"></i>
          RevertClash
        </div>
        <h2>系统初始设置</h2>
      </div>

      <!-- 步骤指示器 -->
      <div class="setup-stepper">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step"
          :class="{
            'active': currentStep === index + 1,
            'completed': currentStep > index + 1
          }"
        >
          <span class="step-number">{{ index + 1 }}</span>
          <span class="step-title">{{ step.title }}</span>
        </div>
      </div>

      <!-- 步骤内容 -->
      <div class="setup-content">
        <!-- 步骤1: 欢迎页 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="welcome-content">
            <i class="bi bi-stars welcome-icon"></i>
            <h3>欢迎使用 RevertClash</h3>
            <p>这是您首次启动系统，我们需要进行一些初始设置。</p>
            <p>首先，您需要创建一个管理员账号，用于管理系统配置和用户。</p>
            <button
              class="btn btn-primary btn-lg w-100 mt-4"
              @click="nextStep"
            >
              <i class="bi bi-arrow-right me-2"></i>
              开始设置
            </button>
          </div>
        </div>

        <!-- 步骤2: 创建管理员账号 -->
        <div v-if="currentStep === 2" class="step-content">
          <h3 class="mb-4">创建管理员账号</h3>

          <form @submit.prevent="submitSetup" class="setup-form">
            <div class="form-group">
              <label for="username" class="form-label">
                <i class="bi bi-person-fill me-2"></i>
                管理员用户名
              </label>
              <input
                type="text"
                class="form-control"
                id="username"
                v-model="formData.username"
                placeholder="请输入用户名"
                required
                :disabled="isSubmitting"
              >
            </div>

            <div class="form-group">
              <label for="password" class="form-label">
                <i class="bi bi-lock-fill me-2"></i>
                密码
              </label>
              <input
                type="password"
                class="form-control"
                id="password"
                v-model="formData.password"
                placeholder="请输入密码"
                required
                :disabled="isSubmitting"
              >
              <div class="form-text">密码长度不能少于6个字符</div>
            </div>

            <div class="form-group">
              <label for="confirmPassword" class="form-label">
                <i class="bi bi-shield-check me-2"></i>
                确认密码
              </label>
              <input
                type="password"
                class="form-control"
                id="confirmPassword"
                v-model="formData.confirmPassword"
                placeholder="请再次输入密码"
                required
                :disabled="isSubmitting"
              >
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {{ errorMessage }}
            </div>

            <!-- 状态提示 -->
            <div v-if="statusMessage" class="status-message text-center mb-3">
              <div v-if="isSubmitting" class="text-info">
                <i class="bi bi-arrow-clockwise spin me-2"></i>
                {{ statusMessage }}
              </div>
              <div v-else-if="statusMessage.includes('成功')" class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                {{ statusMessage }}
              </div>
              <div v-else class="text-danger">
                <i class="bi bi-x-circle me-2"></i>
                {{ statusMessage }}
              </div>
            </div>

            <!-- 按钮组 -->
            <div class="button-group">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="prevStep"
                :disabled="isSubmitting"
              >
                <i class="bi bi-arrow-left me-2"></i>
                上一步
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting">
                  <i class="bi bi-arrow-clockwise spin me-2"></i>
                  创建中...
                </span>
                <span v-else>
                  <i class="bi bi-person-plus me-2"></i>
                  创建账号
                </span>
              </button>
            </div>

            <!-- 故障排除提示 -->
            <div v-if="errorCount >= 2" class="troubleshoot-section mt-4">
              <div class="alert alert-info">
                <h6 class="mb-2">
                  <i class="bi bi-info-circle me-2"></i>
                  遇到问题？
                </h6>
                <p class="mb-2">如果多次尝试注册后仍然无法成功，可能是系统状态出现问题。</p>
                <small>请检查网络连接或联系技术支持。</small>
              </div>
            </div>
          </form>
        </div>

        <!-- 步骤3: 设置完成 -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="success-content text-center">
            <i class="bi bi-check-circle-fill success-icon"></i>
            <h3 class="mt-3">设置完成！</h3>
            <p>管理员账号已成功创建，您现在可以登录系统并开始使用了。</p>
            <p>接下来，您将被重定向到登录页面。</p>
            <button
              class="btn btn-primary btn-lg w-100 mt-4"
              @click="goToLogin"
            >
              <i class="bi bi-box-arrow-in-right me-2"></i>
              前往登录
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="setup-footer">
        <p>RevertClash &copy; 2024</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 响应式数据
const currentStep = ref(1)
const isSubmitting = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const errorCount = ref(0)

// 步骤配置
const steps = [
  { title: '欢迎' },
  { title: '创建账号' },
  { title: '完成' }
]

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 检查系统是否需要初始设置
const checkSetupStatus = async () => {
  try {
    const response = await axios.get('/auth/setup-status')
    const data = response.data

    if (!data.needsSetup) {
      // 系统已设置，重定向到登录页
      router.push('/login')
    }
  } catch (error) {
    console.error('检查设置状态失败:', error)
  }
}

// 下一步
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    // 清空错误信息
    errorMessage.value = ''
    statusMessage.value = ''
  }
}

// 表单验证
const validateForm = () => {
  // 重置错误信息
  errorMessage.value = ''

  if (formData.password !== formData.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return false
  }

  if (formData.password.length < 6) {
    errorMessage.value = '密码长度不能少于6个字符'
    return false
  }

  return true
}

// 提交设置
const submitSetup = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  statusMessage.value = '正在创建账号，请稍候...'

  try {
    const response = await axios.post('/auth/register', {
      username: formData.username,
      password: formData.password,
      isAdmin: true
    })

    if (response.status === 200) {
      statusMessage.value = '账号创建成功！'

      // 延迟进入下一步
      setTimeout(() => {
        nextStep()
      }, 1500)
    }
  } catch (error) {
    errorCount.value++

    const errorMsg = error.response?.data?.error || '创建账号失败'
    errorMessage.value = errorMsg
    statusMessage.value = '账号创建失败，请重试'

    console.error('创建账号失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 前往登录页
const goToLogin = () => {
  router.push('/login')
}

// 页面加载时检查状态
onMounted(() => {
  checkSetupStatus()
})
</script>

<style scoped>
.setup-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.setup-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  width: 100%;
  max-width: 500px;
  position: relative;
  overflow: hidden;
}

.setup-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.setup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.setup-logo {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.setup-logo i {
  font-size: 2.5rem;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.setup-header h2 {
  color: #333;
  margin: 0;
  font-weight: 600;
}

.setup-stepper {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.step.active,
.step.completed {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e9ecef;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.step.completed .step-number {
  background: #28a745;
  color: white;
}

.step-title {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.setup-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  width: 100%;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-content {
  text-align: center;
}

.welcome-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.welcome-content h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.welcome-content p {
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.setup-form .form-group {
  margin-bottom: 1.5rem;
}

.setup-form .form-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.setup-form .form-control {
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.setup-form .form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.button-group .btn {
  flex: 1;
  padding: 12px 24px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.success-content {
  animation: fadeIn 0.5s ease;
}

.success-icon {
  font-size: 4rem;
  color: #28a745;
  animation: successPulse 1.5s ease-in-out;
}

@keyframes successPulse {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.success-content h3 {
  color: #333;
  font-weight: 600;
}

.success-content p {
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.troubleshoot-section {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.status-message {
  margin: 1rem 0;
  font-weight: 500;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.setup-footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.setup-footer p {
  color: #6c757d;
  margin: 0;
  font-size: 0.875rem;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .setup-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
  }

  .setup-stepper {
    gap: 1rem;
  }

  .step-title {
    display: none;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
