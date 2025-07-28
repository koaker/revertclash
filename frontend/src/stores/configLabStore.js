import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as configLabService from '@/services/configLabService';
import { useSourceStore } from './sourceStore';
import yaml from 'js-yaml';

export const useConfigLabStore = defineStore('configLab', () => {
    // State
    const convertedContent = ref('');
    const debugResult = ref(null);
    const isLoading = ref(false);
    const error = ref(null);

    // Actions
    async function convertLinks(links) {
        isLoading.value = true;
        error.value = null;
        convertedContent.value = '';
        try {
            const uris = links.split('\n').filter(uri => uri.trim());
            if (uris.length === 0) {
                throw new Error('请输入至少一个有效的链接');
            }
            const proxies = await configLabService.convertLinks(uris);

            // 在前端构建完整的 YAML 字符串
            const fullConfig = { proxies };
            convertedContent.value = yaml.dump(fullConfig);

        } catch (err) {
            error.value = err.message || '转换失败';
            console.error(err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function saveConvertedConfig(name) {
        isLoading.value = true;
        error.value = null;
        try {
            if (!name.trim()) {
                throw new Error('配置文件名称不能为空');
            }
            if (!convertedContent.value.trim()) {
                throw new Error('没有可保存的内容');
            }
            const finalName = name.endsWith('.yaml') || name.endsWith('.yml') ? name : `${name}.yaml`;
            await configLabService.saveConvertedConfig(finalName, convertedContent.value);

            // 刷新数据源列表
            const sourceStore = useSourceStore();
            await sourceStore.fetchSources();

        } catch (err) {
            error.value = err.message || '保存失败';
            console.error(err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function debugSubscription(name) {
        isLoading.value = true;
        error.value = null;
        debugResult.value = null;
        try {
            if (!name.trim()) {
                throw new Error('请输入要调试的订阅名称');
            }
            const result = await configLabService.debugSubscription(name);
            debugResult.value = result;
        } catch (err) {
            error.value = err.message || '调试失败';
            console.error(err);
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        convertedContent,
        debugResult,
        isLoading,
        error,
        convertLinks,
        saveConvertedConfig,
        debugSubscription,
    };
});
