<template>
  <div class="nodes-view">
    <div class="rc-container">
      <!-- 页面标题 -->
      <div class="page-header mb-4">
        <h1 class="page-title">
          <i class="bi bi-hdd-network"></i>
          节点管理
        </h1>
        <p class="page-subtitle">管理和筛选您的代理节点</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards mb-4">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ selectedInFilterCount }}</div>
            <div class="stat-label">已选节点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-funnel"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ nodeStore.filteredNodes.length }}</div>
            <div class="stat-label">筛选结果</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-hdd-stack"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ nodeStore.totalCount }}</div>
            <div class="stat-label">总节点数</div>
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel mb-4">
        <div class="rc-card modern-card">
          <div class="rc-card-body">
            <div class="control-grid">
              <!-- 筛选器区域 -->
              <div class="filter-section">
                <h6 class="section-title">
                  <i class="bi bi-funnel me-2"></i>
                  筛选器
                </h6>
                <div class="filter-controls">
                  <div class="filter-group">
                    <label class="filter-label">节点类型</label>
                    <select class="form-select modern-select" v-model="nodeStore.selectedType">
                      <option v-for="type in nodeStore.nodeTypes" :key="type" :value="type">
                        {{ type === 'all' ? '所有类型' : type }}
                      </option>
                    </select>
                  </div>
                  <div class="filter-group">
                    <label class="filter-label">搜索节点</label>
                    <div class="search-input-wrapper">
                      <i class="bi bi-search search-icon"></i>
                      <input
                        type="text"
                        class="form-control modern-input"
                        v-model="nodeStore.searchKeyword"
                        placeholder="搜索节点名称或服务器..."
                      />
                      <button
                        v-if="nodeStore.searchKeyword"
                        class="clear-search-btn"
                        @click="nodeStore.searchKeyword = ''"
                      >
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作区域 -->
              <div class="actions-section">
                <h6 class="section-title">
                  <i class="bi bi-gear me-2"></i>
                  操作
                </h6>
                <div class="action-buttons">
                  <button
                    class="rc-btn rc-btn-outline-primary btn-modern"
                    data-bs-toggle="modal"
                    data-bs-target="#sourceManagerModal"
                  >
                    <i class="bi bi-database-gear"></i>
                    <span>管理数据源</span>
                  </button>
                  <button
                    class="rc-btn rc-btn-info btn-modern"
                    @click="nodeStore.exportSelectedLinks"
                    :disabled="nodeStore.selectedCount === 0"
                  >
                    <i class="bi bi-link-45deg"></i>
                    <span>导出链接</span>
                  </button>
                  <button
                    class="rc-btn rc-btn-success btn-modern"
                    @click="downloadSelectedConfig"
                    :disabled="nodeStore.selectedCount === 0"
                  >
                    <i class="bi bi-download"></i>
                    <span>下载配置</span>
                  </button>
                  <button
                    class="rc-btn rc-btn-warning btn-modern"
                    @click="downloadProcessedConfig"
                    :disabled="nodeStore.selectedCount === 0"
                  >
                    <i class="bi bi-gear-wide-connected"></i>
                    <span>处理后配置</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="nodeStore.isLoading" class="loading-state">
        <div class="loading-card">
          <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">正在加载...</span>
            </div>
          </div>
          <h5>正在加载节点数据...</h5>
          <p class="text-muted">请稍候，正在从数据源获取最新节点信息</p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="nodeStore.error" class="error-state">
        <div class="error-card">
          <div class="error-icon">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <h5>加载失败</h5>
          <p class="error-message">{{ nodeStore.error }}</p>
          <button class="rc-btn rc-btn-primary" @click="nodeStore.fetchNodes">
            <i class="bi bi-arrow-clockwise"></i>
            重新加载
          </button>
        </div>
      </div>

      <!-- 节点表格 -->
      <div v-else-if="nodeStore.totalCount > 0" class="nodes-table-container">
        <div class="rc-card modern-card">
          <div class="rc-card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-list-ul me-2"></i>
              节点列表
            </h5>
            <div class="table-controls">
              <div class="bulk-actions" v-if="nodeStore.selectedCount > 0">
                <span class="selected-count">已选择 {{ nodeStore.selectedCount }} 个节点</span>
                <button class="rc-btn rc-btn-sm rc-btn-outline-danger" @click="nodeStore.clearSelection">
                  <i class="bi bi-x-circle"></i>
                  清除选择
                </button>
              </div>
            </div>
          </div>
          <div class="rc-card-body p-0">
            <div class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th class="checkbox-column">
                      <div class="checkbox-wrapper">
                        <input
                          type="checkbox"
                          class="form-check-input"
                          :checked="isAllFilteredSelected"
                          :indeterminate="isFilteredIndeterminate"
                          @change="handleSelectAllFilteredChange"
                        />
                        <label class="checkbox-label">全选</label>
                      </div>
                    </th>
                    <th class="name-column">
                      <i class="bi bi-tag me-1"></i>
                      节点名称
                    </th>
                    <th class="type-column">
                      <i class="bi bi-diagram-3 me-1"></i>
                      类型
                    </th>
                    <th class="server-column">
                      <i class="bi bi-server me-1"></i>
                      服务器
                    </th>
                    <th class="port-column">
                      <i class="bi bi-ethernet me-1"></i>
                      端口
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="node in nodeStore.paginatedNodes"
                    :key="node.name"
                    class="node-row"
                    :class="{ 'selected': nodeStore.selectedNodeNames.has(node.name) }"
                  >
                    <td class="checkbox-column">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="nodeStore.selectedNodeNames.has(node.name)"
                        @change="nodeStore.toggleNodeSelection(node.name)"
                      />
                    </td>
                    <td class="name-column">
                      <div class="node-name">
                        <i class="bi bi-circle-fill node-status" :class="getNodeStatusClass(node)"></i>
                        <span class="name-text">{{ node.name }}</span>
                      </div>
                    </td>
                    <td class="type-column">
                      <span class="node-type-badge" :class="getTypeClass(node.type)">
                        {{ node.type || '未知' }}
                      </span>
                    </td>
                    <td class="server-column">
                      <div class="server-info">
                        <span class="server-text">{{ node.server || '未知' }}</span>
                        <button
                          v-if="node.server"
                          class="copy-btn"
                          @click="copyToClipboard(node.server)"
                          title="复制服务器地址"
                        >
                          <i class="bi bi-clipboard"></i>
                        </button>
                      </div>
                    </td>
                    <td class="port-column">
                      <span class="port-text">{{ node.port || '未知' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 空状态 -->
            <div v-if="nodeStore.filteredNodes.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="bi bi-search"></i>
              </div>
              <h5>没有找到匹配的节点</h5>
              <p class="text-muted">尝试调整筛选条件或搜索关键词</p>
              <button class="rc-btn rc-btn-outline-primary" @click="resetFilters">
                <i class="bi bi-arrow-clockwise"></i>
                重置筛选
              </button>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="nodeStore.totalPages > 1" class="rc-card-footer">
            <div class="pagination-wrapper">
              <div class="pagination-info">
                显示第 {{ (nodeStore.currentPage - 1) * nodeStore.pageSize + 1 }} -
                {{ Math.min(nodeStore.currentPage * nodeStore.pageSize, nodeStore.filteredNodes.length) }} 条，
                共 {{ nodeStore.filteredNodes.length }} 条记录
              </div>
              <nav class="pagination-nav">
                <ul class="pagination modern-pagination">
                  <li class="page-item" :class="{ disabled: nodeStore.currentPage === 1 }">
                    <button
                      class="page-link"
                      @click="nodeStore.changePage(nodeStore.currentPage - 1)"
                      :disabled="nodeStore.currentPage === 1"
                    >
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  <li
                    v-for="page in visiblePages"
                    :key="page"
                    class="page-item"
                    :class="{ active: page === nodeStore.currentPage }"
                  >
                    <button class="page-link" @click="nodeStore.changePage(page)">
                      {{ page }}
                    </button>
                  </li>

                  <li class="page-item" :class="{ disabled: nodeStore.currentPage === nodeStore.totalPages }">
                    <button
                      class="page-link"
                      @click="nodeStore.changePage(nodeStore.currentPage + 1)"
                      :disabled="nodeStore.currentPage === nodeStore.totalPages"
                    >
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <div class="no-data-card">
          <div class="no-data-icon">
            <i class="bi bi-hdd-network"></i>
          </div>
          <h5>暂无节点数据</h5>
          <p class="text-muted">请先添加数据源或检查网络连接</p>
          <div class="no-data-actions">
            <button
              class="rc-btn rc-btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#sourceManagerModal"
            >
              <i class="bi bi-plus-circle"></i>
              添加数据源
            </button>
            <button class="rc-btn rc-btn-outline-primary ms-2" @click="nodeStore.fetchNodes">
              <i class="bi bi-arrow-clockwise"></i>
              刷新数据
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源管理模态框 -->
    <SourceManager modal-id="sourceManagerModal" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNodeStore } from '@/stores/nodeStore';
import SourceManager from '@/components/SourceManager.vue';

const nodeStore = useNodeStore();

// 计算属性
const selectedInFilterCount = computed(() => {
  return nodeStore.filteredNodes.filter(node =>
    nodeStore.selectedNodeNames.has(node.name)
  ).length;
});

const isAllFilteredSelected = computed(() => {
  return nodeStore.filteredNodes.length > 0 &&
    nodeStore.filteredNodes.every(node => nodeStore.selectedNodeNames.has(node.name));
});

const isFilteredIndeterminate = computed(() => {
  const selectedCount = selectedInFilterCount.value;
  return selectedCount > 0 && selectedCount < nodeStore.filteredNodes.length;
});

const visiblePages = computed(() => {
  const current = nodeStore.currentPage;
  const total = nodeStore.totalPages;
  const pages = [];

  // 显示当前页前后2页
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// 方法
const handleSelectAllFilteredChange = (e) => {
  if (e.target.checked) {
    nodeStore.filteredNodes.forEach(node => {
      nodeStore.selectedNodeNames.add(node.name);
    });
  } else {
    nodeStore.filteredNodes.forEach(node => {
      nodeStore.selectedNodeNames.delete(node.name);
    });
  }
};

const downloadSelectedConfig = async () => {
  try {
    const selectedNodes = nodeStore.filteredNodes.filter(node =>
      nodeStore.selectedNodeNames.has(node.name)
    );

    if (selectedNodes.length === 0) {
      alert('请先选择要下载的节点');
      return;
    }

    // 这里调用下载配置的API
    // 实际实现需要根据后端API调整
    console.log('下载选中的配置:', selectedNodes);
  } catch (error) {
    console.error('下载配置失败:', error);
    alert('下载失败: ' + error.message);
  }
};

const downloadProcessedConfig = async () => {
  try {
    const selectedNodes = nodeStore.filteredNodes.filter(node =>
      nodeStore.selectedNodeNames.has(node.name)
    );

    if (selectedNodes.length === 0) {
      alert('请先选择要处理的节点');
      return;
    }

    // 这里调用下载处理后配置的API
    console.log('下载处理后的配置:', selectedNodes);
  } catch (error) {
    console.error('下载处理后配置失败:', error);
    alert('下载失败: ' + error.message);
  }
};

const getNodeStatusClass = (node) => {
  // 根据节点状态返回不同的类名
  if (node.server && node.port) {
    return 'status-active';
  }
  return 'status-inactive';
};

const getTypeClass = (type) => {
  const typeMap = {
    'ss': 'type-ss',
    'ssr': 'type-ssr',
    'vmess': 'type-vmess',
    'vless': 'type-vless',
    'trojan': 'type-trojan',
    'hysteria': 'type-hysteria',
    'hysteria2': 'type-hysteria2'
  };
  return typeMap[type?.toLowerCase()] || 'type-unknown';
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // 这里可以添加一个简单的提示
    console.log('已复制到剪贴板:', text);
  } catch (error) {
    console.error('复制失败:', error);
  }
};

const resetFilters = () => {
  nodeStore.selectedType = 'all';
  nodeStore.searchKeyword = '';
};

// 初始化时获取节点数据
nodeStore.fetchNodes();
</script>

<style scoped>
.nodes-view {
  min-height: 100vh;
  position: relative;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.page-title i {
  color: #3498db;
  margin-right: 0.5rem;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
}

.stat-card:nth-child(1) .stat-icon {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.stat-card:nth-child(2) .stat-icon {
  background: linear-gradient(135deg, #3498db, #74b9ff);
  color: white;
}

.stat-card:nth-child(3) .stat-icon {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

/* 现代化卡片 */
.modern-card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: white;
  overflow: hidden;
}

.modern-card .rc-card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border: none;
  display: flex;
  justify-content: between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  margin: 0;
}

/* 控制面板 */
.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.section-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-weight: 500;
  color: #555;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.modern-select,
.modern-input {
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.modern-select:focus,
.modern-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #95a5a6;
  z-index: 2;
}

.search-input-wrapper .modern-input {
  padding-left: 2.5rem;
  padding-right: 2.5rem;
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #ecf0f1;
  color: #e74c3c;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-align: left;
}

.btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-modern:disabled {
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

/* 状态卡片 */
.loading-state,
.error-state,
.no-data-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-card,
.error-card,
.no-data-card {
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.error-icon,
.no-data-icon {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 1.5rem;
}

.no-data-icon {
  color: #95a5a6;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1.5rem;
}

.no-data-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* 表格样式 */
.nodes-table-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-count {
  color: #3498db;
  font-weight: 500;
  font-size: 0.9rem;
}

.modern-table {
  margin: 0;
  border: none;
}

.modern-table th {
  background: #f8f9fa;
  border: none;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table td {
  border: none;
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #ecf0f1;
}

.node-row {
  transition: all 0.2s ease;
}

.node-row:hover {
  background: #f8f9fa;
}

.node-row.selected {
  background: rgba(52, 152, 219, 0.05);
  border-left: 4px solid #3498db;
}

.checkbox-column {
  width: 60px;
  text-align: center;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.checkbox-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin: 0;
}

.name-column {
  min-width: 250px;
}

.node-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.node-status {
  font-size: 0.6rem;
}

.node-status.status-active {
  color: #27ae60;
}

.node-status.status-inactive {
  color: #e74c3c;
}

.name-text {
  font-weight: 500;
  color: #2c3e50;
}

.type-column {
  width: 120px;
}

.node-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-ss { background: #3498db; color: white; }
.type-ssr { background: #9b59b6; color: white; }
.type-vmess { background: #e74c3c; color: white; }
.type-vless { background: #27ae60; color: white; }
.type-trojan { background: #f39c12; color: white; }
.type-hysteria { background: #1abc9c; color: white; }
.type-hysteria2 { background: #34495e; color: white; }
.type-unknown { background: #95a5a6; color: white; }

.server-column {
  min-width: 200px;
}

.server-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.server-text {
  color: #7f8c8d;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 0.9rem;
}

.copy-btn {
  background: none;
  border: none;
  color: #95a5a6;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.server-info:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background: #ecf0f1;
  color: #3498db;
}

.port-column {
  width: 100px;
}

.port-text {
  color: #7f8c8d;
  font-family: 'SF Mono', 'Monaco', monospace;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #95a5a6;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #ecf0f1;
}

.pagination-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.modern-pagination {
  margin: 0;
}

.modern-pagination .page-link {
  border: none;
  color: #7f8c8d;
  padding: 0.5rem 0.75rem;
  margin: 0 0.125rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modern-pagination .page-link:hover {
  background: #3498db;
  color: white;
}

.modern-pagination .page-item.active .page-link {
  background: #3498db;
  color: white;
}

.modern-pagination .page-item.disabled .page-link {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nodes-view {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .control-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .server-column,
  .name-column {
    min-width: auto;
  }

  .server-text,
  .name-text {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .modern-table th,
  .modern-table td {
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  .node-type-badge {
    padding: 0.125rem 0.5rem;
    font-size: 0.7rem;
  }

  .btn-modern {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
