import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as nodeService from '@/services/nodeService'; // 引入我们创建的 API 服务

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
      const nodes = await nodeService.fetchNodes();
      allNodes.value = nodes;
      const initialSelected = new Set();
      nodes.forEach(node => {
        if (node.selected) {
          initialSelected.add(node.name);
        }
      });
      selectedNodeNames.value = initialSelected;
    } catch (e) {
      error.value = e.message;
      console.error('获取节点失败:', e);
    } finally {
      isLoading.value = false;
    }
  }

  async function toggleNodeSelection(nodeName) {
    const newSelectedNames = new Set(selectedNodeNames.value);
    let nodesToSelect = [];
    let nodesToDeselect = [];
    if (newSelectedNames.has(nodeName)) {
      newSelectedNames.delete(nodeName);
      nodesToDeselect.push(nodeName);
    } else {
      newSelectedNames.add(nodeName);
      nodesToSelect.push(nodeName);
    }
    selectedNodeNames.value = newSelectedNames;
    try {
      await nodeService.updateMultipleNodeSelection(nodesToSelect, nodesToDeselect);
    } catch (e) {
      console.error('同步节点选择状态失败:', e);
    }
  }

  function selectNodes(nodeNames) {
    const newSelectedNames = new Set([...selectedNodeNames.value, ...nodeNames]);
    selectedNodeNames.value = newSelectedNames;
    nodeService.updateMultipleNodeSelection(nodeNames, []).catch(e => {
      console.error('批量选中同步失败:', e);
    });
  }

  function deselectNodes(nodeNames) {
    const newSelectedNames = new Set(selectedNodeNames.value);
    nodeNames.forEach(name => newSelectedNames.delete(name));
    selectedNodeNames.value = newSelectedNames;
    nodeService.updateMultipleNodeSelection([], nodeNames).catch(e => {
      console.error('批量取消选中同步失败:', e);
    });
  }

  async function selectAll() {
    isLoading.value = true;
    try {
      await nodeService.selectAllNodes();
      const allNodeNames = new Set(allNodes.value.map(n => n.name));
      selectedNodeNames.value = allNodeNames;
    } catch (e) {
      error.value = e.message;
      console.error('全选失败:', e);
    } finally {
      isLoading.value = false;
    }
  }

  async function deselectAll() {
    isLoading.value = true;
    try {
      await nodeService.deselectAllNodes();
      selectedNodeNames.value.clear();
    } catch (e) {
      error.value = e.message;
      console.error('取消全选失败:', e);
    } finally {
      isLoading.value = false;
    }
  }

  // 辅助函数：用于触发文本文件下载
  function triggerTextDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  async function exportSelectedLinks() {
    if (selectedNodeNames.value.size === 0) {
      alert('请至少选择一个节点');
      return;
    }
    isLoading.value = true;
    try {
      const nodeNames = Array.from(selectedNodeNames.value);
      const result = await nodeService.exportNodeLinks(nodeNames);
      const lines = [
        `# Exported at: ${new Date().toISOString()}`,
        `# Total selected: ${nodeNames.length}`,
        `# Exported successful: ${result.exported}`,
        `# Exported failed: ${result.failed}`,
        ''
      ];
      if (result.links && result.links.length > 0) {
        lines.push('--- SUCCESS ---');
        result.links.forEach(link => {
          lines.push(`# ${link.name}`);
          lines.push(link.uri);
          lines.push('');
        });
      }
      if (result.errors && result.errors.length > 0) {
        lines.push('--- FAILED ---');
        result.errors.forEach(err => {
          lines.push(`# ${err.name}: ${err.error}`);
        });
      }
      triggerTextDownload(lines.join('\n'), `revertclash-nodes-${Date.now()}.txt`);
    } catch (e) {
      error.value = e.message;
      console.error('导出链接失败:', e);
      alert(`导出链接失败: ${e.message}`);
    } finally {
      isLoading.value = false;
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
    selectAll,
    deselectAll,
    selectNodes,
    deselectNodes,
    changePage,
    exportSelectedLinks,
  };
});
