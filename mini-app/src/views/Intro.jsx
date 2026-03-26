import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        img: '/slides/slide1.png',
        title: 'X-GAME DAVRI',
        desc: 'Keyingi avlod gaming olamiga xush kelibsiz! Yashil neon va kiber-gaming ruhi.'
    },
    {
        img: '/slides/slide2.png',
        title: 'ENG ZO\'R KLUBLAR',
        desc: 'Sizga eng yaqin va eng zamonaviy Game Clublarni bitta ilovada toping.'
    },
    {
        img: '/slides/slide3.png',
        title: 'TEZKOR BOSHQARUV',
        desc: 'Barcha klublarni boshqarish endi ancha oson va juda tez.'
    },
    {
        img: '/slides/slide4.png',
        title: 'NEXUS MARKAZI',
        desc: 'Klub infratuzilmasini professional darajada sozlang va nazorat qiling.'
    },
    {
        img: '/slides/slide5.png',
        title: 'O\'YINNI BOSHLASH',
        desc: 'Tayyormisiz? Hoziroq klubga ulaning va o\'yinni boshlang! ⚡'
    }
];

// 💎 REAL 3D EMERALD CRYSTAL COMPONENT (Professional Edition)
const RealCrystal = ({ style, delay }) => (
    <motion.img
        src="/green-diamond.png"
        animate={{
            y: [0, -40, 0],
            rotate: [0, 30, 0],
            opacity: [0.6, 1, 0.6]
        }}
        transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
        style={{
            position: 'absolute', width: '100px', height: 'auto', zIndex: 5,
            filter: 'drop-shadow(0 0 30px rgba(57, 255, 20, 0.4))',
            pointerEvents: 'none', willChange: 'transform', ...style
        }}
    />
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
                // Stay on last or can auto-finish
            }
        }, 6000); // 6 Secs for better readability

        const progressTimer = setInterval(() => {
            setProgress(prev => Math.min(prev + 0.8, 100)); // Smooth progress
        }, 50);

        return () => { clearInterval(timer); clearInterval(progressTimer); };
    }, [current]);

    return (
        <div className="intro-container-professional" style={{ background: '#050505', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 10000, fontFaimly: '"Outfit", sans-serif' }}>

            {/* 📊 STORY BARS (Premium Styling) */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', display: 'flex', gap: '6px', zIndex: 50 }}>
                {slides.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: i < current ? '100%' : (i === current ? `${progress}%` : '0%') }}
                            style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 15px #39ff14' }}
                        />
                    </div>
                ))}
            </div>

            {/* 🌌 FULL-SCREEN HIGH-RES SCENES */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backgroundImage: `url(${slides[current].img})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        filter: 'contrast(1.1) brightness(0.9)' // Making it sharper
                    }}
                >
                    {/* BLACK GRADIENT FADE OUT - VERY PROFESSIONAL BLENDING */}
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80%', background: 'linear-gradient(to top, #050505 0%, transparent 100%)' }} />
                </motion.div>
            </AnimatePresence>

            {/* 💎 REAL FLOATING 3D CRYSTALS (NO BACHKANA SVG!) */}
            <RealCrystal style={{ top: '12%', left: '5%', width: '140px' }} delay={0} />
            <RealCrystal style={{ bottom: '25%', right: '-5%', width: '160px' }} delay={1.5} />
            <RealCrystal style={{ top: '40%', right: '10%', width: '80px', opacity: 0.4 }} delay={3} />

            {/* 📜 CONTENT IN UZBEK */}
            <div style={{ position: 'absolute', bottom: '60px', left: '30px', right: '30px', zIndex: 60 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: 25, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ height: '2px', width: '25px', background: '#39ff14', boxShadow: '0 0 10px #39ff14' }} />
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '3px', fontWeight: 'bold' }}>NEXUS MARKAZI v2.0</span>
                        </div>

                        <h1 style={{ fontSize: '46px', fontWeight: '900', color: '#fff', margin: '0 0 15px', letterSpacing: '1px', lineHeight: '1' }}>
                            {slides[current].title}
                        </h1>

                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: '1.6', maxWidth: '300px', marginBottom: '50px' }}>
                            {slides[current].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* 🎬 ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {current === slides.length - 1 ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onFinish}
                            style={{
                                flex: 4, background: 'linear-gradient(90deg, #39ff14 0%, #178309 100%)',
                                border: 'none', borderRadius: '15px', padding: '22px',
                                color: '#000', fontSize: '18px', fontWeight: '900',
                                cursor: 'pointer', boxShadow: '0 15px 40px rgba(57, 255, 20, 0.4)',
                                letterSpacing: '2px'
                            }}
                        >
                            O'YINNI BOSHLASH 🔥
                        </motion.button>
                    ) : (
                        <>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setCurrent(prev => prev + 1)}
                                style={{ flex: 1, background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)', padding: '20px', borderRadius: '15px', color: '#39ff14', fontWeight: 'bold' }}
                            >
                                KEYINGISI →
                            </motion.button>
                            <button
                                onClick={onFinish}
                                style={{ flex: 1, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '12px', letterSpacing: '1px' }}
                            >
                                O'TKAZIB YUBORISH
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .intro-container-professional::before {
          content: "";
          position: absolute;
          width: 100%; height: 100%;
          background-image: radial-gradient(rgba(57, 255, 20, 0.05) 1.5px, transparent 1.5px);
          background-size: 50px 50px;
          opacity: 0.3;
          z-index: 1;
        }
      `}</style>
        </div>
    );
};

export default Intro;
