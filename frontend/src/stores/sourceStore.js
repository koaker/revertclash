import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as sourceService from '@/services/sourceService';
import { useNodeStore } from './nodeStore';

export const useSourceStore = defineStore('source', () => {
    // State
    const urls = ref([]);
    const customConfigs = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Actions
    async function fetchSources() {
        isLoading.value = true;
        error.value = null;
        try {
            // 并行获取两种数据源
            const [urlsResponse, configsResponse] = await Promise.all([
                sourceService.getUrls(),
                sourceService.getCustomConfigs()
            ]);
            urls.value = urlsResponse;
            customConfigs.value = configsResponse;
        } catch (err) {
            error.value = err.error || '获取数据源失败';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    // --- URL Actions ---
    async function addUrl(urlData) {
        try {
            await sourceService.addUrl(urlData);
            await fetchSources(); // 刷新列表
            useNodeStore().fetchNodes(); // 刷新节点列表
        } catch (err) {
            console.error('Error adding URL:', err);
            throw err;
        }
    }

    async function deleteUrl(name) {
        try {
            await sourceService.deleteUrl(name);
            await fetchSources(); // 刷新列表
            useNodeStore().fetchNodes(); // 刷新节点列表
        } catch (err) {
            console.error('Error deleting URL:', err);
            throw err;
        }
    }

    // --- Custom Config Actions ---
    async function addCustomConfig(configData) {
        try {
            await sourceService.addCustomConfig(configData);
            await fetchSources(); // 刷新列表
            useNodeStore().fetchNodes(); // 刷新节点列表
        } catch (err) {
            console.error('Error adding custom config:', err);
            throw err;
        }
    }

    async function deleteCustomConfig(id) {
        try {
            await sourceService.deleteCustomConfig(id);
            await fetchSources(); // 刷新列表
            useNodeStore().fetchNodes(); // 刷新节点列表
        } catch (err) {
            console.error('Error deleting custom config:', err);
            throw err;
        }
    }

    return {
        urls,
        customConfigs,
        isLoading,
        error,
        fetchSources,
        addUrl,
        deleteUrl,
        addCustomConfig,
        deleteCustomConfig,
    };
});
