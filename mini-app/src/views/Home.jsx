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
            setClubs(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="home-view" style={{ padding: '20px', paddingBottom: '100px' }}>
            {/* 🚀 TOP SLIDER (Inspiration from Image 3) */}
            <div className="top-slider" style={{ marginBottom: '30px', overflowX: 'auto', display: 'flex', gap: '15px', padding: '10px 0', scrollbarWidth: 'none' }}>
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        className="slider-item"
                        whileTap={{ scale: 0.95 }}
                        style={{
                            minWidth: '280px', height: '160px',
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url("/slide${i}.png")`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            borderRadius: '25px', padding: '20px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff', opacity: 0.8 }}>NEW FEATURES</span>
                        <h3 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>O'yin Olami Slaydi #{i}</h3>
                    </motion.div>
                ))}
            </div>

            {/* 🏛️ GAME CLUB LIST (Image 3 Inspiration) */}
            <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#fff' }}>Game Clublar</h2>

            <div className="clubs-list" style={{ display: 'grid', gap: '20px' }}>
                {clubs.map(club => (
                    <motion.div
                        key={club.id}
                        className="club-card-premium"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onClubSelect(club)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '25px', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', height: '320px'
                        }}
                    >
                        <div style={{ background: 'linear-gradient(135deg, #1e8e0d 0%, #39ff14 100%)', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>🏢</div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>{club.name}</h3>
                                <div style={{ background: '#39ff1422', color: '#39ff14', padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>⭐ FEATURED</div>
                            </div>
                            <p style={{ margin: '5px 0 0', opacity: 0.6, fontSize: '12px' }}>{club.address}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Home;
