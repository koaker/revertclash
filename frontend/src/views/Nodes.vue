<template>
  <div class="node-manager">
    <h1>节点管理</h1>

    <!-- 顶部信息和操作区 -->
    <div class="toolbar">
      <div class="node-stats">
        <span>已选: {{ selectedInFilterCount }} / {{ nodeStore.filteredNodes.length }}</span>
        <span>(总计: {{ nodeStore.totalCount }})</span>
      </div>
      <div class="filters">
        <select v-model="nodeStore.selectedType">
          <option v-for="type in nodeStore.nodeTypes" :key="type" :value="type">
            {{ type === 'all' ? '所有类型' : type }}
          </option>
        </select>
        <input
          type="text"
          v-model="nodeStore.searchKeyword"
          placeholder="搜索节点名称或服务器..."
        />
      </div>
      <div class="actions">
       <button data-bs-toggle="modal" data-bs-target="#sourceManagerModal">
         管理数据源
       </button>
        <button @click="nodeStore.exportSelectedLinks" :disabled="nodeStore.selectedCount === 0">
          导出链接
        </button>
        <button @click="downloadSelectedConfig" :disabled="nodeStore.selectedCount === 0">
          下载配置
        </button>
        <button @click="downloadProcessedConfig" :disabled="nodeStore.selectedCount === 0">
          下载处理后配置
        </button>
      </div>
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
    <div v-else-if="nodeStore.totalCount > 0" class="table-container">
      <div class="table-responsive">
        <table class="node-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  :checked="isAllFilteredSelected"
                  :indeterminate="isFilteredIndeterminate"
                  @change="handleSelectAllFilteredChange"
                />
              </th>
              <th>名称</th>
              <th>类型</th>
              <th>服务器</th>
              <th>端口</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in nodeStore.paginatedNodes" :key="node.name">
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
      <div v-if="nodeStore.filteredNodes.length === 0" class="no-data-message">
        没有找到匹配的节点。
      </div>

      <!-- 分页组件 -->
      <div v-if="nodeStore.totalPages > 1" class="pagination">
        <button @click="nodeStore.changePage(nodeStore.currentPage - 1)" :disabled="nodeStore.currentPage === 1">
          上一页
        </button>
        <span>第 {{ nodeStore.currentPage }} 页 / 共 {{ nodeStore.totalPages }} 页</span>
        <button @click="nodeStore.changePage(nodeStore.currentPage + 1)" :disabled="nodeStore.currentPage === nodeStore.totalPages">
          下一页
        </button>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="no-data-message">
      没有找到任何节点。
    </div>
  </div>
  <SourceManager modal-id="sourceManagerModal" />
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useNodeStore } from '@/stores/nodeStore';
import SourceManager from '@/components/SourceManager.vue';

const nodeStore = useNodeStore();

const selectedInFilterCount = computed(() => {
  const filteredNodeNames = new Set(nodeStore.filteredNodes.map(n => n.name));
  let count = 0;
  for (const name of nodeStore.selectedNodeNames) {
    if (filteredNodeNames.has(name)) {
      count++;
    }
  }
  return count;
});

const isAllFilteredSelected = computed(() => {
  const filteredCount = nodeStore.filteredNodes.length;
  return filteredCount > 0 && selectedInFilterCount.value === filteredCount;
});

const isFilteredIndeterminate = computed(() => {
  return selectedInFilterCount.value > 0 && selectedInFilterCount.value < nodeStore.filteredNodes.length;
});

const handleSelectAllFilteredChange = () => {
  const filteredNodeNames = nodeStore.filteredNodes.map(n => n.name);
  if (isAllFilteredSelected.value) {
    nodeStore.deselectNodes(filteredNodeNames);
  } else {
    nodeStore.selectNodes(filteredNodeNames);
  }
};

// 新增：下载函数
const downloadSelectedConfig = () => {
  if (nodeStore.selectedCount === 0) {
    alert('请至少选择一个节点');
    return;
  }
  // 直接通过 URL 跳转来触发下载
  window.location.href = '/api/nodes/config/selected';
};

const downloadProcessedConfig = () => {
  if (nodeStore.selectedCount === 0) {
    alert('请至少选择一个节点');
    return;
  }
  window.location.href = '/api/nodes/config/processed';
};

onMounted(() => {
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

.node-stats {
  font-size: 0.9em;
  color: #6c757d;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-grow: 1;
  margin: 0 1rem;
}

.filters input, .filters select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.filters input {
  width: 100%;
  max-width: 300px;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  padding: 0.5rem 1rem;
  border: 1px solid #007bff;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  white-space: nowrap;
}

.actions button:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
