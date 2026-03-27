import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const ManagerLogin = ({ onLogin, onBack }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!user || !pass) return;
        setLoading(true);
        try {
            const data = await callAPI('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username: user, password: pass })
            });

            if (data && data.success && data.user?.role === 'manager') {
                onLogin(data);
            } else if (data && data.success && data.user?.role !== 'manager') {
                alert('Siz menejer emassiz! ❌ (Ruxsat yo`q)');
                setPass('');
            } else {
                alert(data?.message || 'Login yoki parol xato! ❌');
                setPass('');
            }
        } catch (err) {
            alert(err.message || 'Tizimga ulanishda xatolik yuz berdi. 🚫');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '70px', marginBottom: '10px' }}>🧑‍💻</div>
                <h2 style={{ fontSize: '28px', color: '#fff', margin: 0, fontWeight: '900', letterSpacing: '2px', textShadow: '0 0 20px #7000ff' }}>CLUB MANAGER</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '10px' }}>Klubni boshqarish uchun shaxsiy profilga kiring</p>
            </div>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '350px', display: 'grid', gap: '20px' }}>
                <input
                    type="text" placeholder="Manager Login ID" value={user} onChange={e => setUser(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(112, 0, 255, 0.3)', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                />
                <input
                    type="password" placeholder="Maxfiy Parol" value={pass} onChange={e => setPass(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(112, 0, 255, 0.3)', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                />

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '10px', background: 'linear-gradient(45deg, #7000ff, #ff00ff)', border: 'none', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 30px rgba(112, 0, 255, 0.3)' }}
                >
                    {loading ? 'TEKSHIRILMOQDA...' : 'KIRISH ⚡'}
                </motion.button>
            </form>

            <button
                onClick={onBack}
                style={{ marginTop: '30px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '1px' }}
            >
                🔙 ORQAGA QAYTISH
            </button>
        </motion.div>
    );
};

export default ManagerLogin;
