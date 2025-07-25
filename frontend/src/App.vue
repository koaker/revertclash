<script setup>
import { useAuthStore } from '@/stores/authStore';
import { onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

const authStore = useAuthStore();

// 在应用根组件挂载时，检查用户的登录状态
onMounted(() => {
  authStore.checkAuthStatus();
});
</script>

<template>
  <div id="app-layout">
    <header>
      <nav>
        <!-- 使用 v-if 来根据登录状态显示不同链接 -->
        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/nodes">节点管理</RouterLink>
          <RouterLink to="/subscriptions">订阅管理</RouterLink>
          <span>欢迎, {{ authStore.user.username }}</span>
          <a href="#" @click.prevent="authStore.logout()">退出登录</a>
        </template>
        <template v-else>
          <RouterLink to="/login">登录</RouterLink>
        </template>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background-color: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

nav {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

nav a, nav span {
  text-decoration: none;
  color: #495057;
  font-weight: 500;
}

nav a.router-link-exact-active {
  color: #007bff;
}

nav a[href="#"] {
    cursor: pointer;
}

main {
  flex-grow: 1;
  padding: 2rem;
}
</style>
