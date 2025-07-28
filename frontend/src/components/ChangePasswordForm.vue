<template>
  <div class="rc-card">
    <div class="rc-card-header">
      <i class="bi bi-key me-2"></i>
      修改密码
    </div>
    <div class="rc-card-body">
      <form @submit.prevent="handleChangePassword">
        <div class="rc-form-group">
          <label for="current-password" class="rc-form-label">当前密码</label>
          <input type="password" class="rc-form-control" id="current-password" v-model="passwordData.currentPassword" required>
        </div>
        <div class="rc-form-group">
          <label for="new-password" class="rc-form-label">新密码</label>
          <input type="password" class="rc-form-control" id="new-password" v-model="passwordData.newPassword" required>
          <div class="rc-form-text">密码长度至少6个字符</div>
        </div>
        <div class="rc-form-group">
          <label for="confirm-password" class="rc-form-label">确认新密码</label>
          <input type="password" class="rc-form-control" id="confirm-password" v-model="confirmPassword" required>
        </div>

        <div v-if="successMessage" class="rc-alert rc-alert-success">{{ successMessage }}</div>
        <div v-if="errorMessage" class="rc-alert rc-alert-danger">{{ errorMessage }}</div>

        <button type="submit" class="rc-btn rc-btn-primary" :disabled="authStore.isLoading">
          <i class="bi bi-check-circle me-1"></i>
          {{ authStore.isLoading ? '保存中...' : '保存修改' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

const passwordData = reactive({
  currentPassword: '',
  newPassword: ''
});
const confirmPassword = ref('');
const successMessage = ref('');
const errorMessage = ref('');

const handleChangePassword = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (passwordData.newPassword !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致';
    return;
  }

  if (passwordData.newPassword.length < 6) {
    errorMessage.value = '新密码长度不能少于6个字符';
    return;
  }

  try {
    const result = await authStore.changePassword(passwordData);
    successMessage.value = result.message || '密码修改成功！';
    // 清空表单
    passwordData.currentPassword = '';
    passwordData.newPassword = '';
    confirmPassword.value = '';
  } catch (error) {
    errorMessage.value = error.message || '密码修改失败，请检查当前密码是否正确。';
  }
};
</script>
