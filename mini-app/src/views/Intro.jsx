import React from 'react';
import { motion } from 'framer-motion';

const Intro = ({ onFinish }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="intro-masterpiece"
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
            {/* 🔮 ANIMATED BACKGROUND ORBS */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                    width: '400px', height: '400px',
                    background: 'radial-gradient(circle, #ff00ff22 0%, transparent 70%)',
                    position: 'absolute', top: '-100px', right: '-100px', filter: 'blur(60px)'
                }}
            />
            <motion.div
                animate={{
                    x: [0, -50, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{
                    width: '500px', height: '500px',
                    background: 'radial-gradient(circle, #7000ff11 0%, transparent 70%)',
                    position: 'absolute', bottom: '-200px', left: '-100px', filter: 'blur(80px)'
                }}
            />

            {/* 👾 LOGO & CONTENT */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 30px' }}>

                {/* ⚡ GLOWING LOGO */}
                <motion.div
                    initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    style={{
                        fontSize: '120px', marginBottom: '10px',
                        filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.5))'
                    }}
                >
                    🎮
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        fontSize: '52px', fontWeight: '900', color: '#fff',
                        margin: '0 0 10px', fontFamily: '"Outfit", sans-serif',
                        letterSpacing: '5px', textShadow: '0 0 20px rgba(255,255,255,0.3)'
                    }}
                >
                    X-GAME
                </motion.h1>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    style={{
                        width: '60px', height: '4px', background: 'linear-gradient(90deg, #ff00ff, #7000ff)',
                        margin: '0 auto 30px', borderRadius: '2px'
                    }}
                />

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    style={{
                        color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: '1.6',
                        marginBottom: '60px', fontWeight: '400', maxWidth: '300px'
                    }}
                >
                    Keyingi avlod gaming olamiga xush kelibsiz! ✨
                </motion.p>

                {/* 🚀 BUTTON WITH NEON GLOW */}
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 0, 255, 0.6)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onFinish}
                    style={{
                        background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)',
                        border: 'none', borderRadius: '20px',
                        color: '#fff', fontSize: '20px', fontWeight: '900',
                        padding: '22px 70px', cursor: 'pointer',
                        boxShadow: '0 15px 40px rgba(255, 0, 255, 0.4)',
                        letterSpacing: '2px'
                    }}
                >
                    KIRISH ⚡
                </motion.button>
            </div>

            {/* FOOTER INFO */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2 }}
                style={{ position: 'absolute', bottom: '40px', color: '#fff', fontSize: '10px', letterSpacing: '2px' }}
            >
                POWERED BY NEXUS ENGINE v1.7.0
            </motion.div>

            {/* CUSTOM CSS FOR MESH BACKGROUND */}
            <style>{`
        .intro-masterpiece::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          opacity: 0.3;
        }
      `}</style>
        </motion.div>
    );
};

export default Intro;
