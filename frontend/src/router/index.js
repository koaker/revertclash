import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/nodes' // 将根路径重定向到节点管理页面
    },
    {
      path: '/nodes',
      name: 'nodes',
      // 路由懒加载：只有访问此页面时才会加载组件
      component: () => import('../views/Nodes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: () => import('../views/Subscriptions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/config-lab',
      name: 'config-lab',
      component: () => import('../views/ConfigLabView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  // 确保在检查登录状态前，已经从 session storage 中恢复了状态
  if (!authStore.isInitialized) {
    await authStore.checkAuthStatus();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isLoggedIn) {
    // 如果需要登录但用户未登录，则重定向到登录页
    next({ name: 'login' });
  } else {
    // 否则，正常导航
    next();
  }
});

export default router
