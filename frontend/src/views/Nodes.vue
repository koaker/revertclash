<template>
  <div class="nodes-view">
    <!-- 页面头部区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-main">
          <div class="header-icon">
            <i class="bi bi-hdd-network"></i>
          </div>
          <div class="header-text">
            <h1 class="page-title">节点管理</h1>
            <p class="page-subtitle">管理和筛选您的代理节点，实时监控节点状态</p>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="premium-btn premium-btn-secondary premium-btn-md"
            @click="nodeStore.fetchNodes"
            :disabled="nodeStore.isLoading"
          >
            <i class="bi bi-arrow-clockwise"></i>
            <span>{{ nodeStore.isLoading ? '刷新中...' : '刷新数据' }}</span>
          </button>
          <button
            class="premium-btn premium-btn-primary premium-btn-md"
            data-bs-toggle="modal"
            data-bs-target="#sourceManagerModal"
          >
            <i class="bi bi-database-gear"></i>
            <span>管理数据源</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="premium-stats-grid">
      <div class="premium-stat-card">
        <div class="premium-stat-header">
          <div class="premium-stat-icon" style="background: var(--gradient-success);">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="premium-stat-trend">
            <i class="bi bi-arrow-up"></i>
            <span>+{{ Math.round((selectedInFilterCount / nodeStore.totalCount) * 100) || 0 }}%</span>
          </div>
        </div>
        <div class="premium-stat-content">
          <div class="premium-stat-number">{{ selectedInFilterCount }}</div>
          <div class="premium-stat-label">已选择节点</div>
          <div class="premium-stat-description">当前筛选条件下已选择的节点数量</div>
        </div>
      </div>

      <div class="premium-stat-card">
        <div class="premium-stat-header">
          <div class="premium-stat-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
            <i class="bi bi-funnel"></i>
          </div>
          <div class="premium-stat-trend">
            <i class="bi bi-filter"></i>
            <span>筛选中</span>
          </div>
        </div>
        <div class="premium-stat-content">
          <div class="premium-stat-number">{{ nodeStore.filteredNodes.length }}</div>
          <div class="premium-stat-label">筛选结果</div>
          <div class="premium-stat-description">符合当前筛选条件的节点数量</div>
        </div>
      </div>

      <div class="premium-stat-card">
        <div class="premium-stat-header">
          <div class="premium-stat-icon" style="background: var(--gradient-secondary);">
            <i class="bi bi-hdd-stack"></i>
          </div>
          <div class="premium-stat-trend">
            <i class="bi bi-database"></i>
            <span>总计</span>
          </div>
        </div>
        <div class="premium-stat-content">
          <div class="premium-stat-number">{{ nodeStore.totalCount }}</div>
          <div class="premium-stat-label">总节点数</div>
          <div class="premium-stat-description">所有数据源中的节点总数</div>
        </div>
      </div>

      <div class="premium-stat-card">
        <div class="premium-stat-header">
          <div class="premium-stat-icon" style="background: linear-gradient(135deg, #06b6d4, #0891b2);">
            <i class="bi bi-activity"></i>
          </div>
          <div class="premium-stat-trend">
            <i class="bi bi-graph-up"></i>
            <span>活跃</span>
          </div>
        </div>
        <div class="premium-stat-content">
          <div class="premium-stat-number">{{ getActiveNodesCount() }}</div>
          <div class="premium-stat-label">活跃节点</div>
          <div class="premium-stat-description">当前可用的活跃节点数量</div>
        </div>
      </div>
    </div>

    <!-- 筛选和操作面板 -->
    <div class="premium-card premium-card-elevated">
      <div class="premium-card-header">
        <h3 class="ds-text-lg ds-font-semibold ds-text-primary">
          <i class="bi bi-sliders2 me-2"></i>
          筛选与操作
        </h3>
      </div>
      <div class="premium-card-body">
        <div class="filters-container">
          <!-- 筛选区域 -->
          <div class="filters-section">
            <div class="filter-row">
              <div class="premium-form-group">
                <label class="premium-form-label">
                  <i class="bi bi-diagram-3"></i>
                  节点类型
                </label>
                <div class="premium-input-wrapper">
                  <select class="premium-input" v-model="nodeStore.selectedType">
                    <option v-for="type in nodeStore.nodeTypes" :key="type" :value="type">
                      {{ type === 'all' ? '全部类型' : type.toUpperCase() }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="premium-form-group">
                <label class="premium-form-label">
                  <i class="bi bi-search"></i>
                  搜索节点
                </label>
                <div class="premium-input-wrapper search-wrapper">
                  <i class="premium-input-icon bi bi-search"></i>
                  <input
                    type="text"
                    class="premium-input has-icon"
                    v-model="nodeStore.searchKeyword"
                    placeholder="搜索节点名称、服务器地址..."
                  />
                  <button
                    v-if="nodeStore.searchKeyword"
                    class="search-clear-btn"
                    @click="nodeStore.searchKeyword = ''"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作区域 -->
          <div class="action-group">
            <h4 class="ds-text-sm ds-font-semibold ds-text-secondary mb-3">
              <i class="bi bi-gear me-2"></i>
              配置导出
            </h4>

            <!-- 新增的场景选择下拉框 -->
            <div class="premium-form-group mb-3">
              <label class="premium-form-label">
                <i class="bi bi-palette"></i>
                选择处理场景
              </label>
              <div class="premium-input-wrapper">
                <select class="premium-input" v-model="selectedScenario">
                  <option v-for="scenario in availableScenarios" :key="scenario" :value="scenario">
                    {{ scenario }}
                  </option>
                </select>
              </div>
            </div>

            <div class="action-buttons">
              <!-- “导出链接”按钮保持不变 -->
              <button
                class="premium-btn premium-btn-outline premium-btn-sm"
                @click="nodeStore.exportSelectedLinks"
                :disabled="nodeStore.selectedCount === 0"
              >
                <i class="bi bi-link-45deg"></i>
                <span>导出链接 ({{ nodeStore.selectedCount }})</span>
              </button>

              <!-- 整合后的唯一下载按钮 -->
              <button
                class="premium-btn premium-btn-success premium-btn-sm"
                @click="downloadConfig"
                :disabled="nodeStore.selectedCount === 0"
              >
                <i class="bi bi-download"></i>
                <!-- 按钮文本会动态显示当前选择的场景 -->
                <span>下载配置 ({{ selectedScenario }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 加载状态 -->
      <div v-if="nodeStore.isLoading" class="loading-state">
        <div class="premium-card premium-card-glass">
          <div class="premium-card-body ds-text-center">
            <div class="premium-spinner premium-spinner-lg ds-text-primary mb-4"></div>
            <h3 class="ds-text-xl ds-font-semibold ds-text-primary mb-2">正在加载节点数据</h3>
            <p class="ds-text-secondary">请稍候，正在从数据源获取最新节点信息...</p>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="nodeStore.error" class="error-state">
        <div class="premium-card premium-card-elevated">
          <div class="premium-card-body ds-text-center">
            <div class="error-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <h3 class="ds-text-xl ds-font-semibold ds-text-primary mb-2">加载失败</h3>
            <p class="ds-text-secondary mb-4">{{ nodeStore.error }}</p>
            <button class="premium-btn premium-btn-primary" @click="nodeStore.fetchNodes">
              <i class="bi bi-arrow-clockwise"></i>
              重新加载
            </button>
          </div>
        </div>
      </div>

      <!-- 节点数据表格 -->
      <div v-else-if="nodeStore.totalCount > 0" class="nodes-data-section">
        <!-- 表格头部信息 -->
        <div class="table-header">
          <div class="table-info">
            <h3 class="ds-text-lg ds-font-semibold ds-text-primary">
              <i class="bi bi-list-ul me-2"></i>
              节点列表
            </h3>
            <p class="ds-text-sm ds-text-secondary">
              显示 {{ (nodeStore.currentPage - 1) * nodeStore.pageSize + 1 }} -
              {{ Math.min(nodeStore.currentPage * nodeStore.pageSize, nodeStore.filteredNodes.length) }} 项，
              共 {{ nodeStore.filteredNodes.length }} 个节点
            </p>
          </div>
          <div class="table-actions" v-if="nodeStore.selectedCount > 0">
            <div class="selection-info">
              <span class="premium-badge premium-badge-primary">
                已选择 {{ nodeStore.selectedCount }} 个节点
              </span>
              <button
                class="premium-btn premium-btn-ghost premium-btn-sm"
                @click="nodeStore.clearSelection"
              >
                <i class="bi bi-x-circle"></i>
                清除选择
              </button>
            </div>
          </div>
        </div>

        <!-- 现代化表格 -->
        <div class="premium-table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th class="checkbox-column">
                  <div class="table-checkbox">
                    <input
                      type="checkbox"
                      class="checkbox-input"
                      :checked="isAllFilteredSelected"
                      :indeterminate="isFilteredIndeterminate"
                      @change="handleSelectAllFilteredChange"
                    />
                    <span class="ds-text-xs ds-text-tertiary">全选</span>
                  </div>
                </th>
                <th class="name-column">
                  <div class="table-header-content">
                    <i class="bi bi-tag me-2"></i>
                    节点名称
                  </div>
                </th>
                <th class="type-column">
                  <div class="table-header-content">
                    <i class="bi bi-diagram-3 me-2"></i>
                    协议类型
                  </div>
                </th>
                <th class="server-column">
                  <div class="table-header-content">
                    <i class="bi bi-server me-2"></i>
                    服务器地址
                  </div>
                </th>
                <th class="port-column">
                  <div class="table-header-content">
                    <i class="bi bi-ethernet me-2"></i>
                    端口
                  </div>
                </th>
                <th class="status-column">
                  <div class="table-header-content">
                    <i class="bi bi-activity me-2"></i>
                    状态
                  </div>
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
                    class="checkbox-input"
                    :checked="nodeStore.selectedNodeNames.has(node.name)"
                    @change="nodeStore.toggleNodeSelection(node.name)"
                  />
                </td>
                <td class="name-column">
                  <div class="node-name-container">
                    <div class="node-avatar">
                      <i class="bi bi-hdd-network"></i>
                    </div>
                    <div class="node-info">
                      <div class="node-name">{{ node.name }}</div>
                      <div class="node-meta">ID: {{ node.name.slice(0, 8) }}...</div>
                    </div>
                  </div>
                </td>
                <td class="type-column">
                  <span class="protocol-badge" :class="getProtocolBadgeClass(node.type)">
                    {{ (node.type || 'unknown').toUpperCase() }}
                  </span>
                </td>
                <td class="server-column">
                  <div class="server-info">
                    <div class="server-text">{{ node.server || '未知' }}</div>
                    <button
                      v-if="node.server"
                      class="copy-server-btn"
                      @click="copyToClipboard(node.server)"
                      title="复制服务器地址"
                    >
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </div>
                </td>
                <td class="port-column">
                  <span class="port-text">{{ node.port || '-' }}</span>
                </td>
                <td class="status-column">
                  <div class="status-indicator" :class="getNodeStatusClass(node)">
                    <div class="status-dot"></div>
                    <span class="status-text">{{ getNodeStatusText(node) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 空状态 -->
          <div v-if="nodeStore.filteredNodes.length === 0" class="empty-state">
            <div class="empty-content">
              <div class="empty-icon">
                <i class="bi bi-search"></i>
              </div>
              <h3 class="ds-text-lg ds-font-semibold ds-text-primary mb-2">没有找到匹配的节点</h3>
              <p class="ds-text-secondary mb-4">尝试调整筛选条件或搜索关键词</p>
              <button class="premium-btn premium-btn-outline premium-btn-sm" @click="resetFilters">
                <i class="bi bi-arrow-clockwise"></i>
                重置筛选条件
              </button>
            </div>
          </div>
        </div>

        <!-- 分页组件 -->
        <div v-if="nodeStore.totalPages > 1" class="pagination-container">
          <div class="pagination-info">
            <span class="ds-text-sm ds-text-secondary">
              显示第 {{ (nodeStore.currentPage - 1) * nodeStore.pageSize + 1 }} -
              {{ Math.min(nodeStore.currentPage * nodeStore.pageSize, nodeStore.filteredNodes.length) }} 条，
              共 {{ nodeStore.filteredNodes.length }} 条记录
            </span>
          </div>
          <div class="pagination-controls">
            <button
              class="premium-btn premium-btn-ghost premium-btn-sm"
              @click="nodeStore.changePage(nodeStore.currentPage - 1)"
              :disabled="nodeStore.currentPage === 1"
            >
              <i class="bi bi-chevron-left"></i>
              上一页
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-btn"
                :class="{ 'active': page === nodeStore.currentPage }"
                @click="nodeStore.changePage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="premium-btn premium-btn-ghost premium-btn-sm"
              @click="nodeStore.changePage(nodeStore.currentPage + 1)"
              :disabled="nodeStore.currentPage === nodeStore.totalPages"
            >
              下一页
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <div class="premium-card premium-card-elevated">
          <div class="premium-card-body ds-text-center">
            <div class="no-data-icon">
              <i class="bi bi-hdd-network"></i>
            </div>
            <h3 class="ds-text-xl ds-font-semibold ds-text-primary mb-2">暂无节点数据</h3>
            <p class="ds-text-secondary mb-6">请先添加数据源或检查网络连接</p>
            <div class="no-data-actions">
              <button
                class="premium-btn premium-btn-primary premium-btn-lg"
                data-bs-toggle="modal"
                data-bs-target="#sourceManagerModal"
              >
                <i class="bi bi-plus-circle"></i>
                添加数据源
              </button>
              <button class="premium-btn premium-btn-secondary premium-btn-lg" @click="nodeStore.fetchNodes">
                <i class="bi bi-arrow-clockwise"></i>
                刷新数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源管理模态框 -->
    <SourceManager modal-id="sourceManagerModal" />
  </div>
</template>

<script setup>
import SourceManager from '@/components/SourceManager.vue';
import { useNodeStore } from '@/stores/nodeStore';
import { computed, onMounted, ref } from 'vue';
// 新增导入
import { fetchScenarios, generateConfig } from '@/services/nodeService'; // <-- 修改点
const nodeStore = useNodeStore();

// vvvvvvvv 在这里添加下面的代码 vvvvvvvv
const availableScenarios = ref([]); // 用于存储从后端获取的场景列表
const selectedScenario = ref('default'); // 用于绑定下拉框的选中值，默认为 'default'

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
const getActiveNodesCount = () => {
  return nodeStore.filteredNodes.filter(node => node.server && node.port).length;
};

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
const downloadConfig = async () => {
  try {
    // 1. 获取当前已选择的节点对象
    const selectedNodes = nodeStore.filteredNodes.filter(node =>
      nodeStore.selectedNodeNames.has(node.name)
    );

    if (selectedNodes.length === 0) {
      alert('请先选择要下载的节点');
      return;
    }

    // 2. 调用我们更新后的 service 函数，传入节点和当前选中的场景
    const blob = await generateConfig(selectedNodes, selectedScenario.value);

    // 3. 创建一个隐藏的 <a> 标签来触发浏览器下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 4. 根据选择的场景动态生成文件名
    a.download = `config-${selectedScenario.value}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('下载配置失败:', error);
    alert('下载失败: ' + error.message);
  }
};


const getNodeStatusClass = (node) => {
  return node.server && node.port ? 'status-active' : 'status-inactive';
};

const getNodeStatusText = (node) => {
  return node.server && node.port ? '在线' : '离线';
};

const getProtocolBadgeClass = (type) => {
  const typeMap = {
    'ss': 'protocol-ss',
    'ssr': 'protocol-ssr',
    'vmess': 'protocol-vmess',
    'vless': 'protocol-vless',
    'trojan': 'protocol-trojan',
    'hysteria': 'protocol-hysteria',
    'hysteria2': 'protocol-hysteria2'
  };
  return typeMap[type?.toLowerCase()] || 'protocol-unknown';
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // TODO: 添加成功提示
    console.log('已复制到剪贴板:', text);
  } catch (error) {
    console.error('复制失败:', error);
  }
};

const resetFilters = () => {
  nodeStore.selectedType = 'all';
  nodeStore.searchKeyword = '';
};

// 使用 onMounted 生命周期钩子，确保在组件挂载后执行
onMounted(async () => {
  try {
    // 调用 service 函数获取场景列表
    availableScenarios.value = await fetchScenarios();

    // 一个健壮性检查：如果获取到的列表中不包含 'default'，
    // 并且列表不为空，则自动选择第一个作为默认值
    if (!availableScenarios.value.includes('default') && availableScenarios.value.length > 0) {
      selectedScenario.value = availableScenarios.value[0];
    }
  } catch (error) {
    console.error('获取场景列表失败:', error);
    // 可以在这里添加一个用户提示，例如使用 alert 或更优雅的通知组件
  }
});

// 初始化时获取节点数据
nodeStore.fetchNodes();
</script>

<style scoped>
.nodes-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: var(--spacing-8);
}

/* 页面头部 */
.page-header {
  margin-bottom: var(--spacing-8);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
}

.header-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-2xl);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: var(--text-2xl);
  box-shadow: var(--shadow-lg);
}

.page-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-1) 0;
  line-height: var(--leading-tight);
}

.page-subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.header-actions {
  display: flex;
  gap: var(--spacing-3);
}

/* 筛选和操作面板 */
.filters-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-8);
  align-items: start;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.search-wrapper {
  position: relative;
}

.search-clear-btn {
  position: absolute;
  right: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--spacing-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
}

.search-clear-btn:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}

.action-group {
  background: var(--surface-secondary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-4);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* 内容区域 */
.content-area {
  margin-top: var(--spacing-6);
}

.loading-state,
.error-state,
.no-data-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.error-icon,
.no-data-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-4xl);
  color: var(--text-tertiary);
  margin: 0 auto var(--spacing-4);
}

.no-data-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
}

/* 表格区域 */
.nodes-data-section {
  background: var(--surface-elevated);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--border-light);
  background: var(--gradient-surface);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* 表格样式 */
.premium-table th {
  background: var(--surface-secondary);
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 2px solid var(--border-light);
}

.premium-table td {
  padding: var(--spacing-4) var(--spacing-6);
}

.table-header-content {
  display: flex;
  align-items: center;
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.table-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-medium);
  cursor: pointer;
}

.node-row {
  transition: all var(--transition-normal);
}

.node-row:hover {
  background: var(--surface-secondary);
}

.node-row.selected {
  background: var(--primary-50);
  border-left: 4px solid var(--primary-500);
}

.node-name-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.node-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  font-size: var(--text-base);
}

.node-info {
  flex: 1;
}

.node-name {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-tight);
}

.node-meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-0-5);
}

.protocol-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.protocol-ss { background: var(--primary-100); color: var(--primary-800); }
.protocol-ssr { background: var(--secondary-100); color: var(--secondary-800); }
.protocol-vmess { background: var(--error-100); color: var(--error-800); }
.protocol-vless { background: var(--success-100); color: var(--success-800); }
.protocol-trojan { background: var(--warning-100); color: var(--warning-800); }
.protocol-hysteria { background: #e0f2fe; color: #0277bd; }
.protocol-hysteria2 { background: var(--neutral-100); color: var(--neutral-800); }
.protocol-unknown { background: var(--neutral-100); color: var(--neutral-600); }

.server-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.server-text {
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-server-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--spacing-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
  opacity: 0;
}

.server-info:hover .copy-server-btn {
  opacity: 1;
}

.copy-server-btn:hover {
  background: var(--surface-secondary);
  color: var(--primary-500);
}

.port-text {
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}

.status-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.status-active .status-dot {
  background: var(--success-500);
}

.status-active .status-text {
  color: var(--success-600);
}

.status-inactive .status-dot {
  background: var(--error-500);
}

.status-inactive .status-text {
  color: var(--error-600);
}

/* 空状态 */
.empty-state {
  padding: var(--spacing-16) var(--spacing-8);
  text-align: center;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--surface-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-4xl);
  color: var(--text-tertiary);
  margin: 0 auto var(--spacing-4);
}

/* 分页 */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-top: 1px solid var(--border-light);
  background: var(--surface-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.page-numbers {
  display: flex;
  gap: var(--spacing-1);
}

.page-btn {
  min-width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: var(--surface-tertiary);
  color: var(--text-primary);
}

.page-btn.active {
  background: var(--primary-500);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .nodes-view {
    padding: var(--spacing-6);
  }

  .filters-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-6);
  }

  .filter-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .nodes-view {
    padding: var(--spacing-4);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-4);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .premium-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-3);
  }

  .pagination-container {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .server-text {
    max-width: 120px;
  }

  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .premium-stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: var(--text-2xl);
  }

  .premium-table th,
  .premium-table td {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-xs);
  }
}
</style>
