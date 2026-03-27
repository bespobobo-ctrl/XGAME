import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        setIsBroadcasting(true);
        try {
            await callAPI('/api/manager/broadcast', {
                method: 'POST',
                body: JSON.stringify({ message: broadcastMessage })
            });
            alert('Xabar muvaffaqiyatli yuborildi!');
            setBroadcastMessage('');
        } catch (e) {
            alert('Xatolik: ' + e.message);
        }
        setIsBroadcasting(false);
    };

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

                        {/* 📋 ASOSIY STATISTIKA (Tepadagi 4 ta blok) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>KUNLIK DAROMAD</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#39ff14' }}>{stats?.revenue?.day?.toLocaleString() || 0} UZS</h3>
                            </div>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>JAMI KOMPYUTERLAR</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#fff' }}>{stats?.totalPCs || 0} ta</h3>
                            </div>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>BAND KOMPYUTERLAR</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#ff4444' }}>{stats?.busyPCs || 0} ta</h3>
                            </div>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>BO'SH KOMPYUTERLAR</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#7000ff' }}>{stats?.freePCs || 0} ta</h3>
                            </div>
                        </div>

                        {/* 👤 OXIRGI TASHRIF */}
                        <div style={{ background: 'linear-gradient(135deg, #7000ff33, #0a0a0a)', padding: '20px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #7000ff55' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#7000ff' }}>⏱️ OXIRGI MIJOZ</h4>
                            {stats?.latestVisit ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.latestVisit.user}</div>
                                        <div style={{ fontSize: '10px', color: '#888' }}>{stats.latestVisit.phone}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', color: '#39ff14' }}>{stats.latestVisit.pc}</div>
                                        <div style={{ fontSize: '10px', color: '#888' }}>{new Date(stats.latestVisit.time).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            ) : <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Hali tashriflar yo'q</p>}
                        </div>

                        {/* 📈 KUNLIK BATAFSIL (PC HOURS & REVENUE) */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#fff' }}>🖥️ KUNLIK PC ISHLASH VAQTLARI</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {stats?.pcStats?.map((pc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontSize: '13px' }}>{pc.name}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#39ff14' }}>{pc.hours.toFixed(1)} soat</div>
                                            <div style={{ fontSize: '10px', color: '#888' }}>{pc.revenue.toLocaleString()} UZS</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 🌟 YANGILIK/XABAR YUBORISH */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#ffaa00' }}>📣 OMMAVIY XABAR BARCHA UCHUN</h4>
                            <textarea
                                value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)}
                                placeholder="Barcha ruyxatdan o'tgan mijozlarga bot orqali xabar yuborish..."
                                style={{ width: '100%', height: '80px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', padding: '10px', fontSize: '12px', resize: 'none', marginBottom: '10px', outline: 'none' }}
                            />
                            <button onClick={handleBroadcast} disabled={isBroadcasting} style={{ width: '100%', padding: '12px', background: isBroadcasting ? '#444' : '#ffaa00', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: isBroadcasting ? 'not-allowed' : 'pointer' }}>
                                {isBroadcasting ? "YUBORILMOQDA..." : "XABARNI YUBORISH 🚀"}
                            </button>
                        </div>

                        {/* 🏆 TOP-3 KOMPYUTERLAR */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#39ff14' }}>🏆 ENG KO'P ISHLAGAN TOP-3 PC</h4>
                            {stats?.topPCs?.map((pc, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1a1a1a', borderRadius: '12px', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>#{i + 1} {pc.name}</div>
                                    <div style={{ fontSize: '14px', color: '#39ff14' }}>{pc.hours.toFixed(1)} soat</div>
                                </div>
                            ))}
                        </div>

                        {/* 📊 OYLIK HAFTALIK YILLIK (DAROMAD, SOAT, OQIM) */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {['day', 'week', 'month', 'year'].map(period => (
                                <div key={period} style={{ background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '20px' }}>
                                    <h5 style={{ margin: '0 0 10px', fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>{period === 'day' ? 'Bugun' : period === 'week' ? 'Shu Hafta' : period === 'month' ? 'Shu Oy' : 'Shu Yil'}</h5>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <div><span style={{ color: '#888' }}>Oqim:</span> <b style={{ color: '#fff' }}>{stats?.flow?.[period] || 0}</b></div>
                                        <div><span style={{ color: '#888' }}>Soat:</span> <b style={{ color: '#39ff14' }}>{stats?.hours?.[period]?.toFixed(1) || 0}</b></div>
                                        <div><span style={{ color: '#888' }}>Daromad:</span> <b style={{ color: '#7000ff' }}>{stats?.revenue?.[period]?.toLocaleString() || 0}</b></div>
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
