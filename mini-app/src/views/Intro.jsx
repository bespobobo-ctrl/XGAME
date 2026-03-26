import React from 'react';
import { motion } from 'framer-motion';

const Intro = ({ onFinish }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="intro-masterpiece-v2"
            style={{
                background: '#0a0510',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                overflow: 'hidden'
            }}
        >
            {/* 🔮 OPTIMIZED BACKGROUND ORBS (Using back-layer for better performance) */}
            <motion.div
                animate={{
                    x: [0, 40, 0],
                    y: [0, -40, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{
                    width: '350px', height: '350px',
                    background: 'rgba(255, 0, 255, 0.15)',
                    position: 'absolute', top: '-10%', right: '-10%', filter: 'blur(50px)',
                    borderRadius: '50%', willChange: 'transform'
                }}
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                    width: '450px', height: '450px',
                    background: 'rgba(112, 0, 255, 0.1)',
                    position: 'absolute', bottom: '-20%', left: '-10%', filter: 'blur(70px)',
                    borderRadius: '50%', willChange: 'transform'
                }}
            />

            {/* 👾 CONTENT WRAPPER */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 40px' }}>

                {/* ⚡ LOGO WITH LESS INTENSE SHADOWS */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 80, delay: 0.3 }}
                    style={{
                        fontSize: '100px', marginBottom: '15px',
                        filter: 'drop-shadow(0 0 15px rgba(255, 0, 255, 0.3))',
                        willChange: 'transform'
                    }}
                >
                    🎮
                </motion.div>

                <motion.h1
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        fontSize: '48px', fontWeight: '900', color: '#fff',
                        margin: '0 0 12px', fontFamily: '"Outfit", sans-serif',
                        letterSpacing: '4px', textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        willChange: 'transform'
                    }}
                >
                    X-GAME
                </motion.h1>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '50px' }}
                    transition={{ delay: 0.8 }}
                    style={{
                        height: '3px', background: 'linear-gradient(90deg, #ff00ff, #7000ff)',
                        margin: '0 auto 35px', borderRadius: '2px'
                    }}
                />

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    style={{
                        color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: '1.5',
                        marginBottom: '50px', fontWeight: '400', maxWidth: '280px',
                        margin: '0 auto 50px'
                    }}
                >
                    Keyingi avlod gaming olamiga xush kelibsiz! ✨
                </motion.p>

                {/* 🚀 SMOOTH BUTTON */}
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onFinish}
                    style={{
                        background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)',
                        border: 'none', borderRadius: '18px',
                        color: '#fff', fontSize: '18px', fontWeight: '900',
                        padding: '20px 60px', cursor: 'pointer',
                        boxShadow: '0 10px 25px rgba(255, 0, 255, 0.3)',
                        letterSpacing: '1px', willChange: 'transform'
                    }}
                >
                    KIRISH ⚡
                </motion.button>
            </div>

            {/* FOOTER */}
            <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '2px' }}>
                POWERED BY NEXUS ENGINE v1.7.5
            </div>

            <style>{`
        .intro-masterpiece-v2::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
          z-index: 0;
        }
      `}</style>
        </motion.div>
    );
};

export default Intro;
