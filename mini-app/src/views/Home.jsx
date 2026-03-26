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

            {/* 🪐 DYNAMIC NEON GLOWS (Ko'rinadigan va daxshatli) */}
            <motion.div
                animate={{ x: [0, 50, -50, 0], y: [0, -40, 40, 0], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                style={{ position: 'fixed', top: '10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(57, 255, 20, 0.18) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: -1 }}
            />
            <motion.div
                animate={{ x: [0, -50, 50, 0], y: [0, 50, -50, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 18, ease: 'linear', delay: 2 }}
                style={{ position: 'fixed', bottom: '15%', right: '-15%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(0, 221, 235, 0.15) 0%, transparent 70%)', filter: 'blur(110px)', zIndex: -1 }}
            />

            {/* 📽️ NOISE GRAIN (Tekstura berish u-n) */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none', background: 'url("https://grainy-gradients.vercel.app/noise.svg")', zIndex: 0 }} />

            {/* 🏙️ HEADER SECTION */}
            <div style={{ padding: '30px 30px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1, position: 'relative' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '1px', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>NODES</h2>
                    <p style={{ margin: 0, fontSize: '10px', color: '#39ff14', fontWeight: 'bold', letterSpacing: '2px' }}>SELECT YOUR STATION</p>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.4, letterSpacing: '1px' }}>20.26 VERSION</div>
            </div>

            {/* 📸 CAROUSEL WITH GLASSMORPHISM */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="clubs-carousel"
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    padding: '30px',
                    paddingBottom: '120px',
                    gap: '25px',
                    scrollbarWidth: 'none',
                    zIndex: 2,
                    position: 'relative'
                }}
            >
                <style>{`.clubs-carousel::-webkit-scrollbar { display: none; }`}</style>

                {clubs.map((club, idx) => (
                    <motion.div
                        key={club.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onClubSelect(club)}
                        style={{
                            minWidth: '85vw',
                            height: '70vh',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            borderRadius: '45px',
                            overflow: 'hidden',
                            background: 'rgba(255, 255, 255, 0.03)', // 💎 GLASS EFFECT
                            backdropFilter: 'blur(30px)', // 🌊 GLASS BLUR
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                        }}
                    >
                        {club.image ? (
                            <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} alt="node" />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '100px', background: 'rgba(57, 255, 20, 0.05)' }}>🏛️</div>
                        )}

                        {/* 🖤 GRADIENT & INFO (Silliq o'tish) */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '50%',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
                            padding: '35px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                        }}>
                            <motion.h2 animate={idx === activeIndex ? { opacity: 1, y: 0 } : {}} style={{ margin: 0, fontSize: '30px', fontWeight: '900', textShadow: '0 5px 15px rgba(0,0,0,1)' }}>{club.name}</motion.h2>
                            <p style={{ margin: '5px 0 15px', fontSize: '12px', color: '#39ff14', fontWeight: 'bold', textShadow: '0 0 10px rgba(57,255,20,0.3)' }}>{club.address}</p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ fontSize: '9px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff1488', color: '#39ff14', fontWeight: '800' }}>{club.level.toUpperCase()} STATION</span>
                                {club.locationUrl && (
                                    <div style={{ fontSize: '9px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(255,255,255,0.08)', border: '1px solid #fff3', color: '#fff' }}>📍 TRAJECTORY</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🌀 DYNAMIC CAPSULE INDICATORS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-100px', zIndex: 3, position: 'relative' }}>
                {clubs.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            width: i === activeIndex ? '28px' : '8px',
                            background: i === activeIndex ? '#39ff14' : 'rgba(255,255,255,0.15)',
                            boxShadow: i === activeIndex ? '0 0 15px #39ff14' : 'none'
                        }}
                        style={{ height: '8px', borderRadius: '10px' }}
                    />
                ))}
            </div>

        </div>
    );
};

export default Home;
