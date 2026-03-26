import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const Home = ({ onClubSelect }) => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const data = await callAPI('/api/clubs');
            setClubs(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleScroll = (e) => {
        const index = Math.round(e.target.scrollLeft / (window.innerWidth * 0.85));
        setActiveIndex(index);
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff14' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>👾</motion.div>
        </div>
    );

    return (
        <div className="home-view" style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>

            {/* 🪐 PREMIUM: FLOATING GAMER ELEMENTS (Lag-free) */}
            <motion.div
                animate={{ y: [0, -30, 0], opacity: [0.05, 0.1, 0.05], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 10 }}
                style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '40px', zIndex: 1 }}
            >🎮</motion.div>
            <motion.div
                animate={{ y: [0, 40, 0], opacity: [0.03, 0.08, 0.03], rotate: [0, -15, 15, 0] }}
                transition={{ repeat: Infinity, duration: 15, delay: 2 }}
                style={{ position: 'absolute', bottom: '25%', right: '15%', fontSize: '50px', zIndex: 1 }}
            >🏆</motion.div>
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0, 0.1, 0] }}
                transition={{ repeat: Infinity, duration: 8 }}
                style={{ position: 'absolute', top: '50%', left: '45%', fontSize: '20px', zIndex: 1 }}
            >✨</motion.div>

            {/* 📸 CAROUSEL WITH BOOSTED UI */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="clubs-carousel"
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    padding: '60px 30px 100px',
                    gap: '20px',
                    scrollbarWidth: 'none',
                    zIndex: 2,
                    position: 'relative',
                    boxSizing: 'border-box'
                }}
            >
                <style>{`.clubs-carousel::-webkit-scrollbar { display: none; }`}</style>

                {clubs.map((club, idx) => (
                    <motion.div
                        key={club.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onClubSelect(club)}
                        style={{
                            minWidth: '85vw',
                            height: '68vh',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            borderRadius: '45px',
                            overflow: 'hidden',
                            background: '#0a0a0a',
                            border: '1px solid rgba(57, 255, 20, 0.15)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                            transform: 'translateZ(0)'
                        }}
                    >
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            {club.image ? (
                                <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="node" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px', background: 'linear-gradient(rgba(57, 255, 20, 0.1), #0a0a0a)' }}>🏛️</div>
                            )}

                            {/* 🖤 BOOSTED INFO SECTION */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                height: '50%',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.98))',
                                padding: '35px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                            }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '36px', // LARGER NAME ✨
                                    fontWeight: '900',
                                    textShadow: '0 0 20px #39ff1433',
                                    lineHeight: 1
                                }}>{club.name}</h2>
                                <p style={{ margin: '8px 0 20px', fontSize: '13px', color: '#c0c0c0', fontWeight: '500' }}>📍 {club.address}</p>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '9px', padding: '7px 15px', borderRadius: '30px', background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff1455', color: '#39ff14', fontWeight: '900', letterSpacing: '1px' }}>{club.level.toUpperCase()} NODE</span>
                                    <span style={{ fontSize: '9px', padding: '7px 15px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #fff1' }}>START MISSION 🚀</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🌀 BOOSTED CAPSULE INDICATORS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-80px', zIndex: 3, position: 'relative' }}>
                {clubs.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            width: i === activeIndex ? '30px' : '10px',
                            background: i === activeIndex ? '#39ff14' : 'rgba(255,255,255,0.2)',
                            boxShadow: i === activeIndex ? '0 0 15px #39ff1488' : 'none'
                        }}
                        style={{ height: '10px', borderRadius: '15px' }}
                    />
                ))}
            </div>

        </div>
    );
};

export default Home;
