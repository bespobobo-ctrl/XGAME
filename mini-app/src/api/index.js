const API_URL = 'https://humidity-parenting-highway-mod.trycloudflare.com';

export const callAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('x-token');
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
};

export default API_URL;
