import React from 'react';
import { motion } from 'framer-motion';

const Intro = ({ onFinish }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="intro-container"
            style={{
                background: 'linear-gradient(135deg, #0f0a1e 0%, #1e1236 100%)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                padding: '30px'
            }}
        >
            <div className="glow-circle" style={{
                width: '280px', height: '280px',
                background: 'radial-gradient(circle, #ff00ff44 0%, transparent 70%)',
                position: 'absolute', top: '20%', filter: 'blur(40px)', zIndex: 0
            }} />

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ zIndex: 1, textAlign: 'center' }}
            >
                <div style={{ fontSize: '100px', marginBottom: '20px' }}>🎮</div>
                <h1 style={{
                    fontSize: '42px', fontWeight: '900', color: '#fff',
                    marginBottom: '10px', fontFamily: '"Outfit", sans-serif'
                }}>X-GAME</h1>
                <p style={{
                    color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: '1.5',
                    marginBottom: '50px', padding: '0 20px'
                }}>
                    Sizga eng yaqin Game Clublarni toping va o'z joyingizni band qiling!
                </p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onFinish}
                    style={{
                        background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)',
                        border: 'none', borderRadius: '50px',
                        color: '#fff', fontSize: '18px', fontWeight: 'bold',
                        padding: '18px 60px', cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(255, 0, 255, 0.3)'
                    }}
                >
                    BOSHLASH 🚀
                </motion.button>
            </motion.div>

            <div style={{ position: 'absolute', bottom: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
                v1.6.0 PROFESSIONAL EDITION
            </div>
        </motion.div>
    );
};

export default Intro;
