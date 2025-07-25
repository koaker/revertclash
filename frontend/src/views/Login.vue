<template>
  <div class="login-container">
    <div class="login-box">
      <h1>登录</h1>
      <!-- @submit.prevent 会阻止表单的默认提交行为 -->
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" v-model="username" required />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="password" required />
        </div>

        <!-- 显示认证错误信息 -->
        <div v-if="authStore.authError" class="error-message">
          {{ authStore.authError }}
        </div>

        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore';
import { ref } from 'vue';

// 获取 auth store 实例
const authStore = useAuthStore();

// 创建响应式变量来绑定表单输入
const username = ref('');
const password = ref('');

// 定义处理登录的函数
const handleLogin = () => {
  if (username.value && password.value) {
    // 调用 store 中的 login action
    authStore.login(username.value, password.value);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 5rem;
}
.login-box {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.form-group {
  margin-bottom: 1.5rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #6c757d;
}
.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  text-align: center;
}
</style>
