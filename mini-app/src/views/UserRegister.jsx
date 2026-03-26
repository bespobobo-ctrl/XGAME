import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API_URL, { callAPI } from '../api';

const UserRegister = ({ club, onBack, onComplete }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!phone || !password) return alert('Ma\'lumotlarni kiriting!');

        setLoading(true);
        try {
            const currentClubId = club?.id;
            // API ga jo'natamiz
            const res = await callAPI('/api/register', {
                method: 'POST',
                body: JSON.stringify({ phone, password, clubId: currentClubId })
            });
            if (res.success) {
                alert(`Klubga xush kelibsiz! 🎉 Siz endi "${club?.name}" klubining rasmiy foydalanuvchisisiz.`);
                onComplete(res);
            } else {
                alert(res.error || 'Serverda xatolik yuz berdi');
            }
        } catch (err) {
            alert('Internet aloqasi yoki server bilan muammo 🚫');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎮</div>
                <h3 style={{ fontSize: '14px', color: '#39ff14', margin: '0 0 5px', letterSpacing: '2px' }}>{club?.name ? club.name.toUpperCase() : 'GAME CLUB'}</h3>
                <h2 style={{ fontSize: '26px', color: '#fff', margin: 0, fontWeight: '900' }}>RO'YXATDAN O'TISH</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '10px' }}>Shu klubning o'yinchisi sifatida profilingizni oching</p>
            </div>

            <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: '350px', display: 'grid', gap: '15px' }}>
                <input
                    type="tel" placeholder="Telefon Raqam (Masalan: +998901234567)"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '20px', borderRadius: '20px', color: '#39ff14', fontSize: '16px', textAlign: 'center', letterSpacing: '1px' }}
                />
                <input
                    type="password" placeholder="Maxfiy Parol yarating"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                />

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                    style={{ width: '100%', marginTop: '15px', background: 'linear-gradient(90deg, #39ff14 0%, #178309 100%)', border: 'none', padding: '22px', borderRadius: '20px', color: '#000', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 30px rgba(57, 255, 20, 0.2)' }}
                >
                    {loading ? 'YARATILMOQDA...' : 'PROFILNI TASDIQLASH 🚀'}
                </motion.button>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '350px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>YOKI TELEGRAM ORQALI</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => alert(`Sizni @${club?.name}_bot Ga yo'naltiruvchi maxsus havolaga o'tkazadi.`)}
                style={{ width: '100%', maxWidth: '350px', marginTop: '20px', background: '#24A1DE', border: 'none', padding: '20px', borderRadius: '20px', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
                TELEGRAM ORQALI KIRISH ✈️
            </motion.button>

            <button onClick={onBack} style={{ marginTop: '30px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}>🔙 KLUB TANLASHGA QAYTISH</button>
        </motion.div>
    );
};

export default UserRegister;
