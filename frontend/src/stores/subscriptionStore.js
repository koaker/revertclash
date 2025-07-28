import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as subscriptionService from '@/services/subscriptionService';

export const useSubscriptionStore = defineStore('subscription', () => {
    // State
    const tokens = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Actions
    async function fetchTokens() {
        isLoading.value = true;
        error.value = null;
        try {
            tokens.value = await subscriptionService.getTokens();
        } catch (err) {
            error.value = err.error || '获取订阅链接失败';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    async function createToken(tokenData) {
        isLoading.value = true;
        error.value = null;
        try {
            await subscriptionService.createToken(tokenData);
            await fetchTokens(); // 重新加载列表
        } catch (err) {
            error.value = err.error || '创建订阅链接失败';
            console.error(err);
            throw err; // 将错误继续抛出，以便组件可以捕获
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteToken(tokenId) {
        // 优化的UI体验：立即从列表中移除
        const originalTokens = [...tokens.value];
        tokens.value = tokens.value.filter(t => t.id !== tokenId);
        error.value = null;

        try {
            await subscriptionService.deleteToken(tokenId);
        } catch (err) {
            // 如果API调用失败，则恢复列表
            tokens.value = originalTokens;
            error.value = err.error || '删除订阅链接失败';
            console.error(err);
        }
    }

    async function regenerateToken(tokenId) {
        isLoading.value = true;
        error.value = null;
        try {
            const updatedToken = await subscriptionService.regenerateToken(tokenId);
            // 更新列表中的对应项
            const index = tokens.value.findIndex(t => t.id === tokenId);
            if (index !== -1) {
                tokens.value[index] = updatedToken;
            }
        } catch (err) {
            error.value = err.error || '重新生成订阅链接失败';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        tokens,
        isLoading,
        error,
        fetchTokens,
        createToken,
        deleteToken,
        regenerateToken,
    };
});
