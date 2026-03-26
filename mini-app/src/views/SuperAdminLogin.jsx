import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminLogin = ({ onLogin, onCancel }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await callAPI('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username: user, password: pass })
            });
            if (data.user.role === 'super_admin') {
                onLogin(data);
            } else {
                alert('Siz Super Admin emassiz! ❌');
            }
        } catch (err) {
            alert('Login yoki parol xato! ❌');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="super-login-modal"
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, height: '100vh',
                background: '#0a050f', zIndex: 10000, padding: '40px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔐</div>
                <h1 style={{ fontSize: '32px', color: '#fff', margin: 0 }}>SUPER ADMIN</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Nexus Command Center-ga kirish</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
                <input
                    placeholder="Admin ID"
                    value={user} onChange={e => setUser(e.target.value)}
                    style={{
                        background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.1)',
                        padding: '20px', borderRadius: '15px', color: '#fff', outline: 'none', fontSize: '16px'
                    }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={pass} onChange={e => setPass(e.target.value)}
                    style={{
                        background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.1)',
                        padding: '20px', borderRadius: '15px', color: '#fff', outline: 'none', fontSize: '16px'
                    }}
                />

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn-brand"
                    disabled={loading}
                    style={{
                        background: 'linear-gradient(90deg, #39ff14 0%, #1e8e0d 100%)',
                        border: 'none', borderRadius: '15px', padding: '20px', color: '#000',
                        fontWeight: 'bold', fontSize: '18px', marginTop: '20px',
                        boxShadow: '0 8px 30px rgba(57, 255, 20, 0.2)'
                    }}
                >
                    {loading ? 'KIRISH...' : 'KIRISH ⚡'}
                </motion.button>

                <button
                    type="button"
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}
                >
                    BEKOR QILISH
                </button>
            </form>
        </motion.div>
    );
};

export default SuperAdminLogin;
