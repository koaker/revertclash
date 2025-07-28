import axios from 'axios';

const URLS_API_URL = '/api/urls';
const CUSTOM_CONFIG_API_URL = '/api/custom-configs';

// --- URL Management ---

export const getUrls = async () => {
    const response = await axios.get(URLS_API_URL);
    return response.data;
};

export const addUrl = async (urlData) => {
    const response = await axios.post(URLS_API_URL, urlData);
    return response.data;
};

export const updateUrl = async (name, urlData) => {
    const response = await axios.put(`${URLS_API_URL}/${encodeURIComponent(name)}`, urlData);
    return response.data;
};

export const deleteUrl = async (name) => {
    await axios.delete(`${URLS_API_URL}/${encodeURIComponent(name)}`);
};


// --- Custom Config Management ---

export const getCustomConfigs = async () => {
    const response = await axios.get(CUSTOM_CONFIG_API_URL);
    return response.data;
};

export const addCustomConfig = async (configData) => {
    const response = await axios.post(CUSTOM_CONFIG_API_URL, configData);
    return response.data;
};

export const updateCustomConfig = async (id, configData) => {
    const response = await axios.put(`${CUSTOM_CONFIG_API_URL}/${id}`, configData);
    return response.data;
};

export const deleteCustomConfig = async (id) => {
    await axios.delete(`${CUSTOM_CONFIG_API_URL}/${id}`);
};
