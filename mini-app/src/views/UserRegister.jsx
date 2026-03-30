import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const UserRegister = ({ club, onBack, onComplete }) => {
    const [loading, setLoading] = useState(false);

    const handleTelegramAuth = async () => {
        const tg = window?.Telegram?.WebApp;
        if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            alert('Iltimos, ushbu dasturni Telegram ichidan oching! ✈️');
            return;
        }

        const tgUser = tg.initDataUnsafe.user;
        const currentClubId = club?.id;

        setLoading(true);
        try {
            const res = await callAPI('/api/telegram-auth', {
                method: 'POST',
                body: JSON.stringify({ tgUser, clubId: currentClubId })
            });

            if (res.success) {
                alert(`Klubga xush kelibsiz! 🎉 Siz endi "${club?.name || 'GAME ZONE'}" klubining foydalanuvchisisiz.`);
                localStorage.setItem('x-token', res.token);
                localStorage.setItem('x-user', JSON.stringify(res.user));
                onComplete(res);
            } else {
                alert(res.error || res.message || 'Serverda xatolik yuz berdi');
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
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ fontSize: '70px', marginBottom: '15px' }}>🎮</div>
                <h3 style={{ fontSize: '15px', color: '#7000ff', margin: '0 0 5px', letterSpacing: '3px', fontWeight: '900' }}>{club?.name ? club.name.toUpperCase() : 'GAME CLUB'}</h3>
                <h2 style={{ fontSize: '28px', color: '#fff', margin: 0, fontWeight: '900' }}>TIZIMGA KIRISH</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '12px', lineHeight: '1.5' }}>
                    Siz ushbu klubning tizimiga maxsus foydalanuvchi sifatida kiryapsiz.
                    Buning uchun faqat Telegram orqali tasdiqlash tugmasini bossangiz yetarli!
                </p>
            </div>

            <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                onClick={handleTelegramAuth}
                style={{ width: '100%', maxWidth: '350px', background: 'linear-gradient(135deg, #24A1DE, #1b7fac)', border: 'none', padding: '22px', borderRadius: '25px', color: '#fff', fontSize: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 15px 30px rgba(36, 161, 222, 0.3)', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center' }}
            >
                {loading ? 'KUTING...' : 'TELEGRAM ORQALI KIRISH ✈️'}
            </motion.button>

            <button onClick={onBack} style={{ marginTop: '40px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>🔙 KLUB TANLASH</button>
        </motion.div>
    );
};

export default UserRegister;
