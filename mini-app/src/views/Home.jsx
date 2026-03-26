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

    // 🌊 SCROLL LISTENER (FOR DOTS)
    const handleScroll = (e) => {
        const index = Math.round(e.target.scrollLeft / (window.innerWidth * 0.85));
        setActiveIndex(index);
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff14' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>✨</motion.div>
            <span style={{ marginLeft: '10px' }}>NEXUS SYNCING...</span>
        </div>
    );

    return (
        <div className="home-view" style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>

            {/* 🪐 2026 TREND: DYNAMIC MESH GRADIENT BACKGROUND */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '101%', height: '101%',
                background: 'radial-gradient(circle at 50% 50%, #050505 0%, #000 100%)',
                zIndex: -2
            }} />

            {/* 🌀 MOVING NEON BLOBS (Glowing Background) */}
            <motion.div
                animate={{
                    x: [0, 50, -50, 0],
                    y: [0, -50, 50, 0],
                    scale: [1, 1.2, 1, 1.1]
                }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                style={{ position: 'fixed', top: '20vh', left: '10vw', width: '300px', height: '300px', background: 'radial-gradient(60% 60% at 50% 50%, rgba(57, 255, 20, 0.08) 0%, transparent 100%)', filter: 'blur(80px)', zIndex: -1 }}
            />
            <motion.div
                animate={{
                    x: [0, -70, 70, 0],
                    y: [0, 80, -80, 0],
                    scale: [1, 1.1, 1.2, 1]
                }}
                transition={{ repeat: Infinity, duration: 25, ease: 'linear', delay: 2 }}
                style={{ position: 'fixed', bottom: '10vh', right: '5vw', width: '400px', height: '400px', background: 'radial-gradient(60% 60% at 50% 50%, rgba(0, 221, 235, 0.06) 0%, transparent 100%)', filter: 'blur(100px)', zIndex: -1 }}
            />

            {/* 📽️ NOISE TEXTURE OVERLAY (Premium Look) */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', background: 'url("https://grainy-gradients.vercel.app/noise.svg")', zIndex: 0 }} />

            {/* 🏙️ HEADER SECTION */}
            <div style={{ padding: '30px 30px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1, position: 'relative' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '1px' }}>NODES</h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#39ff14', fontWeight: 'bold', opacity: 0.7 }}>SELECT YOUR STATION</p>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.3 }}>20.26 VERSION</div>
            </div>

            {/* 📸 CAROUSEL (Snap Scroll) */}
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
                    gap: '20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    zIndex: 2,
                    position: 'relative'
                }}
            >
                <style>{`.clubs-carousel::-webkit-scrollbar { display: none; }`}</style>

                {clubs.map((club, idx) => (
                    <motion.div
                        key={club.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onClubSelect(club)}
                        style={{
                            minWidth: '85vw',
                            height: '70vh',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            borderRadius: '40px',
                            overflow: 'hidden',
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                        }}
                    >
                        {club.image ? (
                            <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="node" />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', background: '#222' }}>🏛️</div>
                        )}

                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '45%',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
                            padding: '35px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '30px', fontWeight: '900', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>{club.name}</h2>
                            <p style={{ margin: '5px 0 15px', fontSize: '12px', color: '#39ff14', fontWeight: 'bold' }}>{club.address}</p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <span style={{ fontSize: '9px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff1455', color: '#39ff14', fontWeight: 'bold' }}>{club.level.toUpperCase()} STATION</span>
                                {club.locationUrl && (
                                    <a href={club.locationUrl} target="_blank" style={{ fontSize: '9px', padding: '6px 14px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid #fff2', color: '#fff', textDecoration: 'none' }}>📍 TRAJECTORY</a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🌀 DYNAMIC DOTS */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-100px', zIndex: 3, position: 'relative' }}>
                {clubs.map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: i === activeIndex ? 1.4 : 1,
                            opacity: i === activeIndex ? 1 : 0.2,
                            width: i === activeIndex ? '20px' : '8px',
                        }}
                        style={{ height: '8px', borderRadius: '10px', background: '#39ff14' }}
                    />
                ))}
            </div>

        </div>
    );
};

export default Home;
