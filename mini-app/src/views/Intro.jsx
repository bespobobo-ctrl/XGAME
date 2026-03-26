import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        img: '/slides/slide1.png',
        title: 'X-GAME ERA',
        desc: 'Keyingi avlod gaming olamiga xush kelibsiz! Yashil neon va kiber-gaming ruhi.'
    },
    {
        img: '/slides/slide2.png',
        title: 'BEST CLUBS',
        desc: 'Sizga eng yaqin va eng premium Game Clublarni bitta ilovada toping.'
    },
    {
        img: '/slides/slide3.png',
        title: 'FAST MGMT',
        desc: 'Barcha klublarni boshqarish endi ancha oson va juda tez.'
    },
    {
        img: '/slides/slide4.png',
        title: 'NEXUS CENTER',
        desc: 'Klub infratuzilmasini professional darajada sozlang va nazorat qiling.'
    },
    {
        img: '/slides/slide5.png',
        title: 'BEGIN TO PLAY',
        desc: 'Tayyormisiz? Hoziroq klubga ulaning va o\'yinni boshlang! ⚡'
    }
];

const Diamond = ({ delay, style }) => (
    <motion.div
        animate={{
            y: [0, -30, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1]
        }}
        transition={{ duration: 10, repeat: Infinity, delay }}
        style={{
            position: 'absolute', width: '40px', height: '40px', zIndex: 5,
            filter: 'drop-shadow(0 0 15px #39ff14)', ...style
        }}
    >
        <svg viewBox="0 0 100 100" fill="#39ff1488">
            <path d="M50 0 L90 40 L50 100 L10 40 Z" />
            <path d="M50 10 L80 40 L50 80 L20 40 Z" fill="#39ff14dd" opacity="0.5" />
        </svg>
    </motion.div>
);

const Intro = ({ onFinish }) => {
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (current < slides.length - 1) {
                setCurrent(prev => prev + 1);
                setProgress(0);
            } else {
                // Optionally wait on the last slide or finish
            }
        }, 5000);

        const progressTimer = setInterval(() => {
            setProgress(prev => Math.min(prev + 1, 100));
        }, 50);

        return () => { clearInterval(timer); clearInterval(progressTimer); };
    }, [current]);

    return (
        <div className="intro-container-pro" style={{ background: '#000', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 10000 }}>

            {/* 🚀 TOP PROGRESS BARS (Instagram Story Style) */}
            <div style={{ position: 'absolute', top: '20px', left: '15px', right: '15px', display: 'flex', gap: '8px', zIndex: 20 }}>
                {slides.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: i < current ? '100%' : (i === current ? `${progress}%` : '0%') }}
                            style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 10px #39ff14' }}
                        />
                    </div>
                ))}
            </div>

            {/* 🔮 BACKGROUND CONTENT */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backgroundImage: `url(${slides[current].img})`,
                        backgroundSize: 'cover', backgroundPosition: 'center'
                    }}
                >
                    {/* GRADIENT OVERLAY FOR TEXT */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to top, #000 0%, transparent 100%)' }} />
                </motion.div>
            </AnimatePresence>

            {/* 💎 FLOATING DIAMONDS (SVG Particles) */}
            <Diamond style={{ top: '15%', left: '10%' }} delay={0} />
            <Diamond style={{ top: '40%', right: '15%' }} delay={1} />
            <Diamond style={{ bottom: '30%', left: '20%' }} delay={2} />
            <Diamond style={{ top: '60%', right: '5%' }} delay={0.5} />

            {/* 📝 CONTENT TEXT */}
            <div style={{ position: 'absolute', bottom: '80px', left: '30px', right: '30px', zIndex: 30 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        style={{ textAlign: 'left' }}
                    >
                        <h2 style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px', margin: '0 0 10px', textTransform: 'uppercase' }}>
                            0{current + 1} / SCI-FI JOURNEY
                        </h2>
                        <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', margin: '0 0 15px', letterSpacing: '2px' }}>
                            {slides[current].title}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', lineHeight: '1.6', maxWidth: '300px' }}>
                            {slides[current].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* 🚀 PRIMARY BUTTON (Only for last slide or can stay throughout) */}
                {current === slides.length - 1 ? (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onFinish}
                        style={{
                            width: '100%', background: 'linear-gradient(90deg, #39ff14 0%, #1e8e0d 100%)',
                            border: 'none', borderRadius: '20px', padding: '22px',
                            color: '#000', fontSize: '20px', fontWeight: '900',
                            marginTop: '40px', cursor: 'pointer',
                            boxShadow: '0 15px 40px rgba(57, 255, 20, 0.4)',
                            letterSpacing: '2px'
                        }}
                    >
                        BEGIN TO PLAY ⚡
                    </motion.button>
                ) : (
                    <button
                        onClick={() => setCurrent(prev => prev + 1)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', marginTop: '40px', fontSize: '14px', letterSpacing: '2px' }}
                    >
                        SKIP →
                    </button>
                )}
            </div>

        </div>
    );
};

export default Intro;
