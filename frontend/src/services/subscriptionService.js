import axios from 'axios';

const API_URL = '/api/subscription-tokens';

/**
 * 获取当前用户的所有订阅Token
 * @returns {Promise<Array>} Token列表
 */
export const getTokens = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription tokens:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};

/**
 * 创建一个新的订阅Token
 * @param {object} tokenData - { name, configTypes, expiresAt? }
 * @returns {Promise<object>} 新创建的Token
 */
export const createToken = async (tokenData) => {
    try {
        const response = await axios.post(API_URL, tokenData);
        return response.data;
    } catch (error) {
        console.error('Error creating subscription token:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};

/**
 * 删除一个指定的订阅Token
 * @param {number} tokenId
 * @returns {Promise<void>}
 */
export const deleteToken = async (tokenId) => {
    try {
        await axios.delete(`${API_URL}/${tokenId}`);
    } catch (error) {
        console.error('Error deleting subscription token:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};

/**
 * 重新生成一个指定的订阅Token
 * @param {number} tokenId
 * @returns {Promise<object>} 重新生成后的Token
 */
export const regenerateToken = async (tokenId) => {
    try {
        const response = await axios.post(`${API_URL}/${tokenId}/regenerate`);
        return response.data;
    } catch (error) {
        console.error('Error regenerating subscription token:', error.response?.data?.error || error.message);
        throw error.response?.data || error;
    }
};
