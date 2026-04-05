export const API_URL = 'https://diesel-creator-dear-mariah.trycloudflare.com';

export const callAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('x-token');

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(options.headers || {})
            }
        });

        // 🛡️ Xavfsiz javob tekshiruvi (Senior approach)
        const contentType = response.headers.get("content-type");
        let data = {};

        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            // Agar JSON bo'lmasa (masalan: 502 error page)
            const text = await response.text();
            data = { success: false, message: 'Serverda kutilmagan xatolik! 🚫', error: text };
        }

        // Agar HTTP status 200-299 bo'lmasa, lekin JSON qaytgan bo'lsa (masalan: 401 Unauthorized)
        // biz baribir datani qaytaramiz, lekin muvaffaqiyatsiz deb belgilaymiz
        if (!response.ok && data.success === undefined) {
            data.success = false;
        }

        // Agar user topilmasa, localStorage tozalanib, qaytadan login so'raladi
        if (data.error === 'User not found' || data.error?.includes('Auth token missing')) {
            localStorage.removeItem('x-token');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return data;

    } catch (e) {
        console.error('[NETWORK ERROR]', e);
        throw new Error('Server bilan aloqa uzildi! 🔌');
    }
};

export default API_URL;
