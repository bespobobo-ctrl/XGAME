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
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>✨</motion.div>
        </div>
    );

    return (
        <div className="home-view" style={{ minHeight: '100vh', background: '#050505', position: 'relative', overflow: 'hidden' }}>

            {/* 🪐 OPTIMIZED GLOWS (Simplified for speed) */}
            <div style={{ position: 'fixed', top: '10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(57, 255, 20, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: -1 }} />
            <div style={{ position: 'fixed', bottom: '15%', right: '-15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 221, 235, 0.05) 0%, transparent 70%)', filter: 'blur(90px)', zIndex: -1 }} />

            {/* 🏙️ HEADER REMOVED AS REQUESTED 🗑️ */}

            {/* 📸 CAROUSEL WITH PERFORMANCE FOCUS */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="clubs-carousel"
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    padding: '80px 30px 120px', // Adjusted to start higher
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
                            height: '70vh',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            borderRadius: '45px',
                            overflow: 'hidden',
                            background: '#111', // Replaced blur with solid for 10x speed
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                            transform: 'translateZ(0)' // HW Acceleration
                        }}
                    >
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            {club.image ? (
                                <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="node" />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', background: 'linear-gradient(45deg, #0a0a0a, #1a1a1a)' }}>🏛️</div>
                            )}

                            {/* 🖤 INFO SECTION */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                height: '40%',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
                                padding: '30px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                            }}>
                                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{club.name}</h2>
                                <p style={{ margin: '5px 0 15px', fontSize: '12px', color: '#31c716', fontWeight: 'bold' }}>📍 {club.address}</p>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '8px', padding: '5px 12px', borderRadius: '30px', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff1444', color: '#39ff14', fontWeight: '800' }}>{club.level.toUpperCase()}</span>
                                    <span style={{ fontSize: '8px', padding: '5px 12px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>CLICK TO SYNC</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🌀 DYNAMIC CAPSULE INDICATORS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-100px', zIndex: 3, position: 'relative', pointerEvents: 'none' }}>
                {clubs.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            width: i === activeIndex ? '24px' : '8px',
                            background: i === activeIndex ? '#39ff14' : 'rgba(255,255,255,0.2)'
                        }}
                        style={{ height: '8px', borderRadius: '10px' }}
                    />
                ))}
            </div>

        </div>
    );
};

export default Home;
