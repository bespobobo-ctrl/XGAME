const API_URL = 'https://dome-treasures-medications-tribute.trycloudflare.com';

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

        // 🛡️ Xavfsiz JSON o'qish
        const data = await response.json();

        // 🛑 Agar server xato qaytarsa, shunchaki datani qaytaramiz (Throw qilmaymiz)
        // Shunda LoginView dagi "success" ni tekshira olamiz
        return data;

    } catch (e) {
        console.error('[NETWORK ERROR]', e);
        // Faqat haqiqiy Tarmoq xatosi bo'lsagina throw qilamiz
        throw new Error('Server bilan aloqa uzildi! 🔌');
    }
};

export default API_URL;
