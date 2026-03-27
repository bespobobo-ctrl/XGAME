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
        // Set up real-time updates (simulated or via websockets in next steps)
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: '30px' }}>⚡</motion.div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff' }}>

            {/* 💎 PREMIUM HEADER */}
            <header style={{ padding: '25px', background: 'linear-gradient(180deg, rgba(112,0,255,0.1), transparent)', borderBottom: '1px solid #111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>{user.username.toUpperCase()}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }} />
                            <span style={{ fontSize: '10px', color: '#39ff14', fontWeight: 'bold' }}>SYSTEM ACTIVE</span>
                        </div>
                    </div>
                    <button onClick={onLogout} style={{ background: '#ff444411', border: '1px solid #ff444433', color: '#ff4444', padding: '8px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>LOGOUT</button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '30px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '9px', opacity: 0.4 }}>REVENUE (TODAY)</p>
                                <h3 style={{ margin: '10px 0 0', fontSize: '22px' }}>{stats?.todayRevenue?.toLocaleString()} <span style={{ fontSize: '10px', opacity: 0.5 }}>UZS</span></h3>
                            </div>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '30px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '9px', opacity: 0.4 }}>SESSIONS</p>
                                <h3 style={{ margin: '10px 0 0', fontSize: '22px', color: '#39ff14' }}>{stats?.activePlayers || 0}</h3>
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(45deg, #7000ff11, transparent)', border: '1px solid #7000ff33', padding: '25px', borderRadius: '35px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px' }}>LIVE STREAM MONITOR 🎥</h4>
                            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #333', borderRadius: '20px', fontSize: '11px', color: '#666' }}>
                                WAITING FOR BROADCAST...
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && (
                    <motion.div key="rooms" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ padding: '20px', display: 'grid', gap: '20px' }}>
                        {rooms.map(room => (
                            <div key={room.id} style={{ background: '#0a0a0a', border: '1px solid #222', padding: '25px', borderRadius: '35px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#7000ff' }}>{room.name}</h3>
                                    <span style={{ fontSize: '10px', background: '#39ff1411', color: '#39ff14', padding: '5px 12px', borderRadius: '10px' }}>ONLINE</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    {room.Computers?.map(pc => (
                                        <div key={pc.id} style={{ aspectRatio: '1/1', background: '#000', border: '1px solid #111', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '900' }}>{pc.name.split('-')[0]}</div>
                                            <div style={{ width: '4px', height: '4px', background: pc.status === 'available' ? '#39ff14' : '#ff4444', borderRadius: '50%', marginTop: '5px' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '25px', borderRadius: '35px', display: 'grid', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222' }}>
                                <span style={{ fontSize: '13px', opacity: 0.6 }}>Language / Til</span>
                                <b>O'zbekcha 🇺🇿</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222' }}>
                                <span style={{ fontSize: '13px', opacity: 0.6 }}>Notifications</span>
                                <b style={{ color: '#39ff14' }}>ON</b>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ManagerDashboard;
