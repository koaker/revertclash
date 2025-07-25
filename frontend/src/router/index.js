import { createRouter, createWebHistory } from 'vue-router'

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
      component: () => import('../views/Nodes.vue')
    },
    {
      path: '/subscriptions',
      name: 'subscriptions',
      component: () => import('../views/Subscriptions.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue')
    }
  ]
})

export default router
