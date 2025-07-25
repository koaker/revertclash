import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as nodeService from '@/services/nodeService'; // 引入我们创建的 API 服务

// 使用 defineStore 创建一个 store，'nodes' 是这个 store 的唯一 ID
export const useNodeStore = defineStore('nodes', () => {
  // ========== State (状态) ==========
  // 存放从后端获取的原始节点列表
  const allNodes = ref([]);
  // 存放用户选中的节点名称，使用 Set 结构可以高效地进行增删和检查
  const selectedNodeNames = ref(new Set());
  // 标记当前是否正在从后端加载数据
  const isLoading = ref(false);
  // 存放加载过程中可能发生的错误信息
  const error = ref(null);

  // ========== Getters (计算属性) ==========
  // 计算已选中的节点数量
  const selectedCount = computed(() => selectedNodeNames.value.size);
  // 计算总节点数量
  const totalCount = computed(() => allNodes.value.length);
  // 根据名称集合，从 allNodes 中筛选出完整的选中节点对象数组
  const selectedNodes = computed(() =>
    allNodes.value.filter(node => selectedNodeNames.value.has(node.name))
  );

  // ========== Actions (方法) ==========
  /**
   * 从后端 API 获取所有节点，并更新状态
   */
  async function fetchNodes() {
    isLoading.value = true;
    error.value = null;
    try {
      const nodes = await nodeService.fetchNodes();
      allNodes.value = nodes;

      // 加载后，根据节点的 'selected' 属性初始化选中集合
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

  /**
   * 切换单个节点的选中状态
   * @param {string} nodeName - 要切换状态的节点名称
   */
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

    // 立即更新前端UI，提供更好的用户体验
    selectedNodeNames.value = newSelectedNames;

    // 调用API服务，在后台同步到服务器
    try {
      await nodeService.updateMultipleNodeSelection(nodesToSelect, nodesToDeselect);
    } catch (e) {
      console.error('同步节点选择状态失败:', e);
      // 如果失败，可以考虑回滚UI或提示用户
      // 为了简单起见，我们暂时只在控制台打印错误
    }
  }

  // 暴露出 state, getters, 和 actions，以便组件可以使用
  return {
    // State
    allNodes,
    selectedNodeNames,
    isLoading,
    error,
    // Getters
    selectedCount,
    totalCount,
    selectedNodes,
    // Actions
    fetchNodes,
    toggleNodeSelection,
  };
});
