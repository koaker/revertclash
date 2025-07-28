import axios from 'axios';

const API_URL = '/api/users';

/**
 * 获取所有用户列表 (仅管理员)
 * @returns {Promise<Array>}
 */
export const getUsers = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};

/**
 * 创建一个新用户 (仅管理员)
 * @param {object} userData - { username, password, isAdmin }
 * @returns {Promise<object>}
 */
export const createUser = async (userData) => {
    try {
        const response = await axios.post(API_URL, userData);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};

/**
 * 删除一个用户 (仅管理员)
 * @param {number} userId
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
    try {
        await axios.delete(`${API_URL}/${userId}`);
    } catch (error) {
        console.error('Error deleting user:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};
