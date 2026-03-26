import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const Home = ({ onClubSelect }) => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#39ff14' }}>NEXUS INITIALIZING... ✨</div>;

    return (
        <div className="home-view" style={{ minHeight: '100vh', background: '#050505', paddingTop: '20px' }}>

            {/* 🌌 DYNAMIC BACKGROUND BLUR */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, #39ff1411 0%, transparent 70%)', zIndex: -1 }} />

            {/* 📸 CAROUSEL CONTAINER (Snap Scroll) */}
            <div
                className="clubs-carousel"
                style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    padding: '0 30px',
                    paddingBottom: '100px',
                    gap: '20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                <style>{`.clubs-carousel::-webkit-scrollbar { display: none; }`}</style>

                {clubs.length > 0 ? clubs.map(club => (
                    <motion.div
                        key={club.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onClubSelect(club)}
                        style={{
                            minWidth: '85vw',
                            height: '75vh',
                            scrollSnapAlign: 'center',
                            position: 'relative',
                            borderRadius: '45px',
                            overflow: 'hidden',
                            background: '#111',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
                        }}
                    >
                        {/* 🖼️ CLUB IMAGE */}
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            {club.image ? (
                                <img
                                    src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={club.name}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #111, #222)', fontSize: '100px' }}>🏛️</div>
                            )}

                            {/* 🖤 GRADIENT OVERLAY (Xuddi rasmda bo'lganidek) */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, right: 0,
                                height: '50%',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                padding: '35px'
                            }}>
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h2 style={{ margin: '0 0 5px', fontSize: '30px', fontWeight: '900', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{club.name}</h2>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#39ff14', fontWeight: '600', opacity: 0.8, letterSpacing: '1px' }}>{club.address.toUpperCase()}</p>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <span style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(57, 255, 20, 0.2)', border: '1px solid #39ff1455', color: '#39ff14', fontWeight: 'bold' }}>{club.level.toUpperCase()}</span>
                                        <span style={{ fontSize: '10px', padding: '5px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold' }}>ONLINE</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div style={{ minWidth: '85vw', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        No nodes found in the network.
                    </div>
                )}
            </div>

            {/* 🌀 SLIDER DOTS INDICATOR */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '-60px' }}>
                {clubs.map((_, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? '#39ff14' : 'rgba(255,255,255,0.2)' }} />
                ))}
            </div>

        </div>
    );
};

export default Home;
