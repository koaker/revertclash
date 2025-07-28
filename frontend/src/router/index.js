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
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/Setup.vue')
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 确保在检查登录状态前，已经从 session storage 中恢复了状态
  if (!authStore.isInitialized) {
    await authStore.checkAuthStatus();
  }

  // 检查是否需要初始设置
  if (authStore.needsSetup && to.name !== 'setup') {
    // 如果需要初始设置且不是访问setup页面，则重定向到setup页面
    next({ name: 'setup' });
    return;
  }

  // 如果系统已设置完成，但用户试图访问setup页面，则重定向到登录页
  if (!authStore.needsSetup && to.name === 'setup') {
    next({ name: 'login' });
    return;
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
