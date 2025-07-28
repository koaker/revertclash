import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as userService from '@/services/userService';

export const useUserManagementStore = defineStore('userManagement', () => {
    // State
    const users = ref([]);
    const isLoading = ref(false);
    const error = ref(null);

    // Actions
    async function fetchUsers() {
        isLoading.value = true;
        error.value = null;
        try {
            users.value = await userService.getUsers();
        } catch (err) {
            error.value = err.error || '获取用户列表失败';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    async function addUser(userData) {
        isLoading.value = true;
        error.value = null;
        try {
            await userService.createUser(userData);
            await fetchUsers(); // 重新加载列表
        } catch (err) {
            error.value = err.error || '创建用户失败';
            console.error(err);
            throw err; // 将错误继续抛出，以便组件可以捕获
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteUser(userId) {
        const originalUsers = [...users.value];
        users.value = users.value.filter(u => u.id !== userId);
        error.value = null;

        try {
            await userService.deleteUser(userId);
        } catch (err) {
            users.value = originalUsers; // 恢复列表
            error.value = err.error || '删除用户失败';
            console.error(err);
            throw err;
        }
    }

    return {
        users,
        isLoading,
        error,
        fetchUsers,
        addUser,
        deleteUser,
    };
});
