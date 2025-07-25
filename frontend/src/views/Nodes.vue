<template>
  <div class="node-manager">
    <h1>节点管理</h1>

    <!-- 顶部信息和操作区 -->
    <div class="toolbar">
      <div class="node-stats">
        <span>已选: {{ nodeStore.selectedCount }}</span> /
        <span>总计: {{ nodeStore.totalCount }}</span>
      </div>
      <!-- 可以在这里添加搜索框、筛选等 -->
    </div>

    <!-- 加载状态提示 -->
    <div v-if="nodeStore.isLoading" class="loading-indicator">
      正在加载节点...
    </div>

    <!-- 错误状态提示 -->
    <div v-else-if="nodeStore.error" class="error-message">
      加载失败: {{ nodeStore.error }}
      <button @click="nodeStore.fetchNodes">重试</button>
    </div>

    <!-- 节点列表表格 -->
    <div v-else-if="nodeStore.totalCount > 0" class="table-responsive">
      <table class="node-table">
        <thead>
          <tr>
            <th><input type="checkbox" /></th>
            <th>名称</th>
            <th>类型</th>
            <th>服务器</th>
            <th>端口</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in nodeStore.allNodes" :key="node.name">
            <td>
              <input
                type="checkbox"
                :checked="nodeStore.selectedNodeNames.has(node.name)"
                @change="nodeStore.toggleNodeSelection(node.name)"
              />
            </td>
            <td>{{ node.name }}</td>
            <td><span class="badge">{{ node.type || '未知' }}</span></td>
            <td>{{ node.server || '未知' }}</td>
            <td>{{ node.port || '未知' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-data-message">
      没有找到任何节点。
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useNodeStore } from '@/stores/nodeStore';

// 1. 在组件中获取 store 实例
const nodeStore = useNodeStore();

// 2. 在组件挂载到 DOM 后，触发 action 从后端获取数据
onMounted(() => {
  // 只有当节点列表为空时才获取，避免重复加载
  if (nodeStore.allNodes.length === 0) {
    nodeStore.fetchNodes();
  }
});
</script>

<style scoped>
.node-manager {
  max-width: 1200px;
  margin: 0 auto;
  font-family: sans-serif;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.loading-indicator, .error-message, .no-data-message {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-message button {
    margin-left: 1rem;
}

.table-responsive {
  overflow-x: auto;
}

.node-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.node-table th, .node-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.node-table th {
  background-color: #f8f9fa;
}

.badge {
  display: inline-block;
  padding: .25em .6em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: .25rem;
  background-color: #6c757d;
  color: #fff;
}
</style>
