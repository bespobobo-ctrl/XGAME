import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const ManagerLogin = ({ onLogin, onBack }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const userRef = useRef(null);
    const passRef = useRef(null);

    // 📱 Telegram WebApp expand + auto-focus (input freeze fix)
    useEffect(() => {
        try { window.Telegram?.WebApp?.expand(); } catch (e) { }
        setTimeout(() => userRef.current?.focus(), 400);
    }, []);

    // Xato xabari 3 sekunddan keyin yo'qoladi
    useEffect(() => {
        if (errorMsg) {
            const t = setTimeout(() => setErrorMsg(''), 3000);
            return () => clearTimeout(t);
        }
    }, [errorMsg]);

    const showError = (msg) => {
        setErrorMsg(msg);
        setPass('');
        setLoading(false);
        // Input'ga qayta focus
        setTimeout(() => passRef.current?.focus(), 100);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!user || !pass) return;
        setLoading(true);
        setErrorMsg('');
        try {
            const data = await callAPI('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username: user, password: pass })
            });

            if (data && data.success && data.user?.role === 'manager') {
                onLogin(data);
            } else if (data && data.success && data.user?.role !== 'manager') {
                showError('Siz menejer emassiz! ❌');
            } else {
                showError(data?.message || 'Login yoki parol xato! ❌');
            }
        } catch (err) {
            showError(err.message || 'Serverga ulanishda xatolik! 🚫');
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

            {/* ⚠️ XATO XABARI (alert o'rniga) */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        style={{ width: '100%', maxWidth: '350px', padding: '15px 20px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '15px', marginBottom: '20px', textAlign: 'center', color: '#ff4444', fontSize: '14px', fontWeight: 'bold' }}
                    >
                        {errorMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '350px', display: 'grid', gap: '20px' }}>
                <input
                    ref={userRef}
                    type="text" placeholder="Manager Login ID" value={user} onChange={e => setUser(e.target.value)}
                    onTouchStart={() => userRef.current?.focus()}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(112, 0, 255, 0.3)', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                />
                <input
                    ref={passRef}
                    type="password" placeholder="Maxfiy Parol" value={pass} onChange={e => setPass(e.target.value)}
                    onTouchStart={() => passRef.current?.focus()}
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
