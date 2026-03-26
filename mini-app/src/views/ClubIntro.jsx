import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../api';

const slides = [
    { id: 1, title: 'NEXUS NODE', description: 'Klub tizimiga xush kelibsiz. Eng yuqori tezlik va sifat.', icon: '🛰️' },
    { id: 2, title: 'DOTA 2', description: 'Professional darajadagi turnirlar va 100% FPS kafolati.', icon: '🎭' },
    { id: 3, title: 'CS:GO 2', description: 'Eng past ping va professional qurilmalar (144Hz+).', icon: '🔫' },
    { id: 4, title: 'LOLZ', description: 'Sizning o\'yin mahoratingiz uchun ideal joy.', icon: '⚡' }
];

const ClubIntro = ({ club, onFinish, onBack }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const next = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
        else onFinish(); // Slayd tugagach ro'yxatdan o'tishga ketadi
    };

    const bgImage = club?.image ? `${API_URL}${club.image}` : '';

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#050505', zIndex: 1000, overflow: 'hidden' }}
        >
            {/* 🖼️ DYNAMIC BACKGROUND (Faqat klubning o'z rasmidan foydalaniladi) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.4 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(10px)'
                    }}
                />
            </AnimatePresence>

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: '30px', boxSizing: 'border-box', justifyContent: 'flex-end', background: 'linear-gradient(transparent, rgba(5,5,5,0.95))' }}>

                {/* 🏮 TOP INDICATORS */}
                <div style={{ position: 'absolute', top: '40px', left: '30px', right: '30px', display: 'flex', gap: '8px' }}>
                    {slides.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', background: i <= currentSlide ? '#39ff14' : 'rgba(255,255,255,0.1)', borderRadius: '10px', transition: '0.3s' }} />
                    ))}
                </div>

                <button onClick={onBack} style={{ position: 'absolute', top: '70px', left: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid #fff1', color: '#fff', borderRadius: '15px', padding: '10px 20px', fontSize: '12px' }}>BACK</button>

                {/* 📝 CONTENT */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
                        style={{ marginBottom: '40px' }}
                    >
                        <span style={{ fontSize: '40px' }}>{slides[currentSlide].icon}</span>
                        <h1 style={{ fontSize: '42px', fontWeight: '950', margin: '15px 0 10px', letterSpacing: '2px', textShadow: '0 0 20px rgba(57,255,20,0.3)' }}>{slides[currentSlide].title}</h1>
                        <p style={{ fontSize: '16px', color: '#aaa', lineHeight: 1.6, maxWidth: '80%' }}>{slides[currentSlide].description}</p>
                    </motion.div>
                </AnimatePresence>

                {/* 🎡 BUTTONS  */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={next}
                        style={{ background: 'linear-gradient(45deg, #39ff14, #00ff88)', border: 'none', padding: '22px', borderRadius: '25px', fontWeight: 'bold', color: '#000', fontSize: '14px', boxShadow: '0 10px 30px rgba(57,255,20,0.2)' }}
                    >
                        {currentSlide === slides.length - 1 ? 'GET STARTED' : 'CONTINUE'}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onFinish}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #fff1', color: '#fff', padding: '22px', borderRadius: '25px', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        SKIP
                    </motion.button>
                </div>

            </div>
        </motion.div>
    );
};

export default ClubIntro;
