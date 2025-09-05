import { exportNodeLinks, fetchNodes as fetchNodesFromApi } from '@/services/nodeService';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// 使用 defineStore 创建一个 store，'nodes' 是这个 store 的唯一 ID
export const useNodeStore = defineStore('nodes', () => {
  // ========== State (状态) ==========
  const allNodes = ref([]);
  const selectedNodeNames = ref(new Set());
  const isLoading = ref(false);
  const error = ref(null);
  const searchKeyword = ref('');
  const selectedType = ref('all');
  const currentPage = ref(1);
  const nodesPerPage = ref(20);

  // ========== Getters (计算属性) ==========
  const selectedCount = computed(() => selectedNodeNames.value.size);
  const totalCount = computed(() => allNodes.value.length);

  const nodeTypes = computed(() => {
    const types = new Set(allNodes.value.map(node => node.type || '未知'));
    return ['all', ...Array.from(types)];
  });

  const filteredNodes = computed(() => {
    currentPage.value = 1;
    return allNodes.value.filter(node => {
      const keyword = searchKeyword.value.trim().toLowerCase();
      const typeMatch = selectedType.value === 'all' || (node.type || '未知') === selectedType.value;
      const keywordMatch = !keyword ||
                           node.name.toLowerCase().includes(keyword) ||
                           (node.server && node.server.toLowerCase().includes(keyword));
      return typeMatch && keywordMatch;
    });
  });

  const totalPages = computed(() => {
    return Math.ceil(filteredNodes.value.length / nodesPerPage.value);
  });

  const paginatedNodes = computed(() => {
    const startIndex = (currentPage.value - 1) * nodesPerPage.value;
    const endIndex = startIndex + nodesPerPage.value;
    return filteredNodes.value.slice(startIndex, endIndex);
  });

  const selectedNodes = computed(() =>
    allNodes.value.filter(node => selectedNodeNames.value.has(node.name))
  );

  // ========== Actions (方法) ==========
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  }

  async function fetchNodes() {
    isLoading.value = true;
    error.value = null;
    try {
      // 调用时不再需要 nodeService. 前缀
      const nodes = await fetchNodesFromApi();
      allNodes.value = nodes;
      // 清空旧的选择，因为节点列表已更新
      selectedNodeNames.value.clear();
    } catch (e) {
      error.value = e.message;
      console.error('获取节点失败:', e);
    } finally {
      isLoading.value = false;
    }
  }

  // 修改 toggleNodeSelection action
  function toggleNodeSelection(nodeName) {
    if (selectedNodeNames.value.has(nodeName)) {
      selectedNodeNames.value.delete(nodeName);
    } else {
      selectedNodeNames.value.add(nodeName);
    }
  }
  // 新增 clearSelection action
  function clearSelection() {
    selectedNodeNames.value.clear();
  }

  // 新增 selectFilteredNodes action
  function selectFilteredNodes() {
    filteredNodes.value.forEach(node => selectedNodeNames.value.add(node.name));
  }

  async function exportSelectedLinks() {
    try {
    // 1. 过滤出完整的已选节点对象
    const selectedNodes = filteredNodes.value.filter(node =>
      selectedNodeNames.value.has(node.name)
    );

    if (selectedNodes.length === 0) {
      alert('请先选择要导出的节点');
      return;
    }

    // 2. 调用新的 service，传入节点对象数组
    const result = await exportNodeLinks(selectedNodes);

    // 3. 处理返回结果 (例如显示一个模态框或复制到剪贴板)
    console.log('导出的链接:', result.links);
    // 可以在这里添加 UI 提示

  } catch (error) {
    console.error('导出链接失败:', error);
    alert('导出失败: ' + error.message);
  }
  }

  return {
    // State
    allNodes,
    selectedNodeNames,
    isLoading,
    error,
    searchKeyword,
    selectedType,
    currentPage,
    nodesPerPage,
    // Getters
    selectedCount,
    totalCount,
    selectedNodes,
    nodeTypes,
    filteredNodes,
    totalPages,
    paginatedNodes,
    // Actions
    fetchNodes,
    toggleNodeSelection,
    changePage,
    exportSelectedLinks,
    clearSelection,
    selectFilteredNodes,
  };
});
