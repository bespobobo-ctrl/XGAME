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

const Intro = ({ onFinish }) => {
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (current < slides.length - 1) {
                setCurrent(prev => prev + 1);
                setProgress(0);
            } else {
                // Can auto-finish if needed
            }
        }, 5500);

        const progressTimer = setInterval(() => {
            setProgress(prev => Math.min(prev + 0.9, 100));
        }, 50);

        return () => { clearInterval(timer); clearInterval(progressTimer); };
    }, [current]);

    return (
        <div className="intro-clean-premium" style={{ background: '#000', height: '100vh', width: '100vw', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 10000 }}>

            {/* 📊 STORY PROGRESS (Tech style) */}
            <div style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', display: 'flex', gap: '5px', zIndex: 100 }}>
                {slides.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: i < current ? '100%' : (i === current ? `${progress}%` : '0%') }}
                            style={{ height: '100%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }}
                        />
                    </div>
                ))}
            </div>

            {/* 🌌 CINEMATIC SCENES */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        position: 'absolute', width: '100%', height: '100%',
                        backgroundImage: `url(${slides[current].img})`,
                        backgroundSize: 'cover', backgroundPosition: 'center'
                    }}
                >
                    {/* PROFESSIONAL BLACK BLENDING OVERLAY */}
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, #000 0%, #000000aa 30%, transparent 100%)' }} />
                </motion.div>
            </AnimatePresence>

            {/* 🔦 SOFT VOLUMETRIC LIGHT BEAMS (Instead of crystals) */}
            <motion.div
                animate={{ x: [-100, 100, -100], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', top: 0, left: '20%', width: '100px', height: '100%', background: 'linear-gradient(to bottom, transparent, #39ff1433, transparent)', transform: 'skewX(-20deg)', filter: 'blur(100px)', pointerEvents: 'none' }}
            />
            <motion.div
                animate={{ x: [100, -100, 100], opacity: [0.05, 0.2, 0.05] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', top: 0, right: '10%', width: '150px', height: '100%', background: 'linear-gradient(to bottom, transparent, #39ff1422, transparent)', transform: 'skewX(15deg)', filter: 'blur(80px)', pointerEvents: 'none' }}
            />

            {/* 📝 CINEMATIC TEXT CONTENT */}
            <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', zIndex: 110 }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            style={{ fontSize: '12px', color: '#39ff14', letterSpacing: '6px', fontWeight: 'bold', marginBottom: '15px' }}
                            initial={{ letterSpacing: '0px' }} animate={{ letterSpacing: '6px' }}
                        >
                            NEXUS 2.0
                        </motion.div>

                        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', margin: '0 0 20px', fontFamily: '"Outfit", sans-serif', letterSpacing: '1px', textShadow: '0 0 20px rgba(57,255,20,0.3)' }}>
                            {slides[current].title}
                        </h1>

                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: '1.6', maxWidth: '300px', marginBottom: '60px', fontWeight: '300' }}>
                            {slides[current].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* 🚀 TECH BUTTONS */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {current === slides.length - 1 ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onFinish}
                            style={{
                                flex: 4, background: 'linear-gradient(90deg, #39ff14 0%, #178309 100%)',
                                border: 'none', borderRadius: '15px', padding: '22px',
                                color: '#000', fontSize: '18px', fontWeight: '900',
                                cursor: 'pointer', boxShadow: '0 20px 50px rgba(57, 255, 20, 0.4)',
                                letterSpacing: '3px'
                            }}
                        >
                            BOSHLASH 🔥
                        </motion.button>
                    ) : (
                        <>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrent(prev => prev + 1)}
                                style={{ flex: 1, background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.4)', padding: '20px', borderRadius: '15px', color: '#39ff14', fontWeight: 'bold', fontSize: '14px' }}
                            >
                                KEYINGISI →
                            </motion.button>
                            <button
                                onClick={onFinish}
                                style={{ flex: 1, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '2px' }}
                            >
                                O'TKAZIB YUBORISH
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        body { background: #000; margin: 0; }
        .intro-clean-premium::before {
          content: "";
          position: absolute;
          width: 100%; height: 100%;
          background: radial-gradient(circle, transparent 20%, #000 80%);
          z-index: 10;
          pointer-events: none;
        }
      `}</style>
        </div>
    );
};

export default Intro;
