import React from 'react';
import { motion } from 'framer-motion';

const Intro = ({ onFinish }) => {
    // Floating Diamond positions
    const diamonds = [
        { top: '10%', left: '5%', size: '80px', delay: 0, x: [0, 20, 0], y: [0, -30, 0] },
        { top: '25%', right: '10%', size: '120px', delay: 1, x: [0, -40, 0], y: [0, 40, 0] },
        { bottom: '15%', left: '15%', size: '60px', delay: 2, x: [0, 30, 0], y: [0, -20, 0] },
        { bottom: '20%', right: '5%', size: '100px', delay: 0.5, x: [0, -15, 0], y: [0, 50, 0] },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="intro-neon-green"
            style={{
                background: '#050505',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                overflow: 'hidden',
                fontFamily: '"Outfit", sans-serif'
            }}
        >
            {/* 🔮 BACKGROUND GLOW SHAFTS */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, #39ff1411 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, #39ff1408 0%, transparent 70%)', filter: 'blur(120px)' }} />
            </div>

            {/* 🎨 FLOATING DIAMONDS (Crystals) */}
            {diamonds.map((d, i) => (
                <motion.img
                    key={i}
                    src="/green-diamond.png"
                    animate={{ x: d.x, y: d.y, rotate: [0, 15, 0] }}
                    transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear", delay: d.delay }}
                    style={{
                        position: 'absolute', top: d.top, left: d.left, right: d.right, bottom: d.bottom,
                        width: d.size, height: 'auto',
                        filter: 'drop-shadow(0 0 15px #39ff1466)',
                        opacity: 0.8, zIndex: 0, willChange: 'transform'
                    }}
                />
            ))}

            {/* 🛡️ HERO CHARACTER (Futuristic Green Girl) */}
            <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 80, delay: 0.4 }}
                style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}
            >
                <img
                    src="/green-hero.png"
                    alt="Hero"
                    style={{
                        width: '240px', height: 'auto', borderRadius: '40px',
                        boxShadow: '0 0 60px rgba(57, 255, 20, 0.4)',
                        border: '2px solid rgba(57, 255, 20, 0.2)'
                    }}
                />
                {/* CHARACTER GLOW EFFECT */}
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'radial-gradient(circle, transparent 50%, #39ff1422 100%)',
                        borderRadius: '40px'
                    }}
                />
            </motion.div>

            {/* 👾 TEXT & ACTIONS */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <motion.h1
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{
                        fontSize: '52px', fontWeight: '900', color: '#fff',
                        margin: '0 0 10px', letterSpacing: '8px',
                        textShadow: '0 0 25px rgba(57, 255, 20, 0.6)'
                    }}
                >
                    X-GAME
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    style={{
                        color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '2px',
                        marginBottom: '40px', textTransform: 'uppercase', fontWeight: 'bold'
                    }}
                >
                    The most accessible iGaming platform
                </motion.p>

                {/* 🚀 NEON GREEN BUTTON */}
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(57, 255, 20, 0.8)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onFinish}
                    style={{
                        background: 'linear-gradient(90deg, #39ff14 0%, #1e8e0d 100%)',
                        border: 'none', borderRadius: '15px',
                        color: '#000', fontSize: '18px', fontWeight: '900',
                        padding: '20px 70px', cursor: 'pointer',
                        boxShadow: '0 10px 40px rgba(57, 255, 20, 0.4)',
                        letterSpacing: '3px', willChange: 'transform'
                    }}
                >
                    BEGIN TO PLAY ⚡
                </motion.button>
            </div>

            <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(57, 255, 20, 0.5)', fontSize: '10px', letterSpacing: '3px' }}>
                IGAMING INFRASTRUCTURE v2.0
            </div>

            <style>{`
        .intro-neon-green::before {
          content: "";
          position: absolute;
          width: 100%; height: 100%;
          background-image: 
            linear-gradient(rgba(57, 255, 20, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57, 255, 20, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.4;
        }
      `}</style>
        </motion.div>
    );
};

export default Intro;
