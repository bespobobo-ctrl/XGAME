import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL, { callAPI } from '../api';

const SuperAdminLogin = ({ onLogin, onCancel }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [serverStatus, setServerStatus] = useState('checking');
    const userRef = useRef(null);
    const passRef = useRef(null);

    useEffect(() => {
        try { window.Telegram?.WebApp?.expand(); } catch (e) { }
        const checkServer = async () => {
            try {
                const res = await fetch(`${API_URL}/ping`);
                if (res.ok) setServerStatus('online');
                else setServerStatus('offline');
            } catch (e) {
                setServerStatus('offline');
            }
        };
        checkServer();
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

            if (data && data.success) {
                onLogin(data);
            } else {
                showError(data?.message || 'Login yoki parol xato! ❌');
            }
        } catch (err) {
            console.error(err);
            showError(err.message || 'Serverga bog\'lanishda xatolik! 🚫');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <motion.div initial={{ y: -20 }} animate={{ y: 0 }} style={{ marginBottom: '40px' }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔐</div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0', color: '#fff', letterSpacing: '2px' }}>SUPER ADMIN</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '5px' }}>Nexus Command Center-ga kirish</p>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '15px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverStatus === 'online' ? '#39ff14' : (serverStatus === 'offline' ? '#ff4444' : '#ffaa00'), boxShadow: serverStatus === 'online' ? '0 0 10px #39ff14' : 'none' }} />
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                            SERVER: {serverStatus.toUpperCase()}
                        </span>
                    </div>
                </motion.div>

                {/* ⚠️ XATO XABARI */}
                <AnimatePresence>
                    {errorMsg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            style={{ padding: '15px 20px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '15px', marginBottom: '20px', color: '#ff4444', fontSize: '14px', fontWeight: 'bold' }}
                        >
                            {errorMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
                    <input
                        ref={userRef}
                        className="glass-input"
                        type="text" placeholder="Login" value={user} onChange={e => setUser(e.target.value)}
                        onTouchStart={() => userRef.current?.focus()}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '22px', borderRadius: '20px', color: '#fff', fontSize: '18px', textAlign: 'center', transition: 'all 0.3s' }}
                    />
                    <input
                        ref={passRef}
                        className="glass-input"
                        type="password" placeholder="Parol" value={pass} onChange={e => setPass(e.target.value)}
                        onTouchStart={() => passRef.current?.focus()}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '22px', borderRadius: '20px', color: '#fff', fontSize: '18px', textAlign: 'center', transition: 'all 0.3s' }}
                    />

                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={loading || serverStatus === 'offline'}
                        style={{ background: serverStatus === 'offline' ? '#333' : 'linear-gradient(90deg, #39ff14 0%, #178309 100%)', border: 'none', padding: '22px', borderRadius: '20px', color: '#000', fontSize: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: serverStatus === 'offline' ? 'none' : '0 20px 40px rgba(57, 255, 20, 0.2)', opacity: serverStatus === 'offline' ? 0.5 : 1 }}
                    >
                        {loading ? 'KIRISH...' : 'KIRISH 🔥'}
                    </motion.button>
                </form>

                <button
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', marginTop: '30px', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer' }}
                >
                    BEKOR QILISH
                </button>
            </div>

            <style>{`
                .glass-input:focus {
                    outline: none;
                    border-color: #39ff14 !important;
                    background: rgba(57, 255, 20, 0.05) !important;
                    box-shadow: 0 0 20px rgba(57, 255, 20, 0.1);
                }
            `}</style>
        </motion.div>
    );
};

export default SuperAdminLogin;
