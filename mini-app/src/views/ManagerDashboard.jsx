import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [s, r] = await Promise.all([
                    callAPI('/api/manager/stats'),
                    callAPI('/api/manager/rooms')
                ]);
                setStats(s);
                setRooms(r || []);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s update for real-time feel
        return () => clearInterval(interval);
    }, []);

    const renderPC = (pc, room) => {
        const isActive = pc.status === 'busy';
        // Mock session data for UI demo (in real app, this comes from backend with PC)
        const mockTimeLeft = isActive ? "01:24:10" : "00:00:00";
        const progress = isActive ? 65 : 0;

        return (
            <motion.div
                key={pc.id}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: '#0a0a0a',
                    border: `1px solid ${isActive ? '#39ff1433' : '#222'}`,
                    borderRadius: '20px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, height: '2px', background: '#39ff14', width: `${progress}%`, boxShadow: '0 0 10px #39ff14' }}
                    />
                )}

                <span style={{ fontSize: '10px', fontWeight: '900', color: isActive ? '#39ff14' : '#666' }}>{pc.name}</span>

                <div style={{ margin: '10px 0', fontSize: '14px', fontWeight: 'bold', color: isActive ? '#fff' : '#444' }}>
                    {isActive ? mockTimeLeft : "FREE"}
                </div>

                <div style={{
                    width: '6px', height: '6px',
                    background: pc.status === 'available' || pc.status === 'free' ? '#39ff14' : pc.status === 'busy' ? '#ff00ff' : '#444',
                    borderRadius: '50%',
                    boxShadow: `0 0 10px ${pc.status === 'available' || pc.status === 'free' ? '#39ff14' : pc.status === 'busy' ? '#ff00ff' : '#000'}`
                }} />
            </motion.div>
        );
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: '40px' }}
            >
                ⚡
            </motion.div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '100px' }}>

            {/* 💎 PREMIUM HEADER */}
            <header style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>{user.username.toUpperCase()}</h2>
                    <span style={{ fontSize: '9px', color: '#7000ff', fontWeight: 'bold' }}>MANAGER NODE ACTIVE 🌐</span>
                </div>
                <button onClick={onLogout} style={{ background: 'none', border: '1px solid #ff444433', color: '#ff4444', padding: '8px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>LOGOUT</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ padding: '20px' }}>

                        {/* 📊 CORE STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #111, #050505)', padding: '25px', borderRadius: '35px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, letterSpacing: '1px' }}>REVENUE TODAY</p>
                                <h3 style={{ margin: '10px 0 0', fontSize: '22px', fontWeight: '900' }}>{stats?.todayRevenue?.toLocaleString()} <span style={{ fontSize: '10px', opacity: 0.4 }}>UZS</span></h3>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, #111, #050505)', padding: '25px', borderRadius: '35px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, letterSpacing: '1px' }}>ACTIVE SESSIONS</p>
                                <h3 style={{ margin: '10px 0 0', fontSize: '22px', color: '#39ff14', fontWeight: '900' }}>{stats?.activePlayers || 0}</h3>
                            </div>
                        </div>

                        {/* ⏳ CLUB TIMER (VISUAL CENTER) */}
                        <div style={{ background: 'linear-gradient(180deg, #111, #000)', border: '1px solid #7000ff33', padding: '30px', borderRadius: '45px', textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #7000ff11', borderTopColor: '#7000ff', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(112,0,255,0.1)' }}>
                                <div style={{ fontSize: '24px', fontWeight: '950' }}>{stats?.activePlayers || 0}</div>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>SYSTEM HEALTH</h4>
                            <p style={{ fontSize: '10px', color: '#39ff14', marginTop: '5px' }}>ALL NODES OPERATIONAL 🟢</p>
                        </div>

                        {/* 🎥 LIVE ROOM OVERVIEW */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {rooms.map(room => (
                                <div key={room.id} style={{ background: '#111', padding: '20px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <b style={{ fontSize: '15px' }}>{room.name}</b>
                                        <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>{room.pcSpecs}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{room.Computers?.filter(c => c.status === 'busy').length} / {room.pcCount}</div>
                                        <div style={{ fontSize: '8px', color: '#39ff14' }}>OCCUPIED</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && (
                    <motion.div key="rooms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ padding: '20px' }}>
                        {rooms.map(room => (
                            <div key={room.id} style={{ marginBottom: '35px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#7000ff', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{room.pricePerHour.toLocaleString()} UZS/h</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                    {room.Computers?.map(pc => renderPC(pc, room))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '30px', borderRadius: '40px', display: 'grid', gap: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '12px', color: '#7000ff', letterSpacing: '2px' }}>CLUB CONFIG</h4>

                            <div style={{ padding: '15px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#888' }}>Auto-Lock PC</span>
                                <b style={{ color: '#39ff14' }}>ENABLED</b>
                            </div>

                            <div style={{ padding: '15px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#888' }}>Language</span>
                                <b>UZBEK 🇺🇿</b>
                            </div>

                            <button
                                onClick={() => setActiveTab('stats')}
                                style={{ marginTop: '20px', background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 'bold' }}>
                                SAVE CHANGES
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ManagerDashboard;
