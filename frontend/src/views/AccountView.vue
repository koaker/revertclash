<template>
  <div class="rc-layout-with-sidebar">
    <!-- 侧边栏 -->
    <div class="rc-sidebar">
      <ul class="rc-sidebar-menu">
        <li>
          <a href="#" @click.prevent="setActiveSection('password')" :class="{ active: activeSection === 'password' }">
            <i class="bi bi-key"></i>
            修改密码
          </a>
        </li>
        <li v-if="authStore.isAdmin">
          <a href="#" @click.prevent="setActiveSection('users')" :class="{ active: activeSection === 'users' }">
            <i class="bi bi-people"></i>
            用户管理
          </a>
        </li>
      </ul>
    </div>

    <!-- 主内容 -->
    <div class="rc-main-content">
      <h4 class="rc-mb-4">账号管理</h4>

      <!-- 动态组件 -->
      <div v-if="activeSection === 'password'">
        <ChangePasswordForm />
      </div>

      <div v-if="activeSection === 'users' && authStore.isAdmin">
        <UserManagement />
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
/* 样式直接从 account.html 迁移过来 */
.rc-layout-with-sidebar {
  display: flex;
  flex-grow: 1;
}

.rc-sidebar {
  width: 240px;
  flex-shrink: 0;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
}

.rc-sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rc-sidebar-menu li a {
  display: block;
  padding: 0.75rem 1rem;
  color: #495057;
  text-decoration: none;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
}

.rc-sidebar-menu li a:hover {
  background-color: #e9ecef;
}

.rc-sidebar-menu li a.active {
  background-color: var(--rc-primary-color, #0d6efd);
  color: white;
}

.rc-sidebar-menu li a i {
  margin-right: 0.75rem;
}

.rc-main-content {
  flex-grow: 1;
  padding: 2rem;
}
</style>
