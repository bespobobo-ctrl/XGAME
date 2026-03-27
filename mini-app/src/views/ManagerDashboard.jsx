import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [showAddRoom, setShowAddRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });

    const handleAddRoom = async () => {
        if (!newRoom.name) return alert('Xona nomini kiriting!');
        setActionLoading(true);
        try {
            await callAPI('/api/manager/setup', {
                method: 'POST',
                body: JSON.stringify({ rooms: [newRoom] })
            });
            const r = await callAPI('/api/manager/rooms');
            setRooms(r || []);
            setShowAddRoom(false);
            setNewRoom({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleAction = async (action) => {
        if (!selectedPC) return;
        setActionLoading(true);
        try {
            await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST',
                body: JSON.stringify({ action })
            });
            const r = await callAPI('/api/manager/rooms');
            setRooms(r || []);
            setSelectedPC(null);
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

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
        let elapsedTime = "00:00:00";
        let progress = 0;

        if (isActive && pc.Sessions?.length > 0) {
            const start = new Date(pc.Sessions[0].startTime);
            const now = new Date();
            const diffSeconds = Math.floor((now - start) / 1000);
            const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (diffSeconds % 60).toString().padStart(2, '0');
            elapsedTime = `${h}:${m}:${s}`;
            progress = Math.min((diffSeconds / 3600) * 100, 100);
        }

        const getStatusColor = () => {
            if (pc.status === 'free' || pc.status === 'available') return '#39ff14';
            if (pc.status === 'busy') return '#ff00ff';
            if (pc.status === 'reserved') return '#ffaa00';
            if (pc.status === 'vip') return '#00ffff';
            return '#444';
        };
        const color = getStatusColor();

        return (
            <motion.div
                key={pc.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPC(pc)}
                style={{
                    background: '#0a0a0a',
                    border: `1px solid ${isActive ? color + '33' : '#222'}`,
                    borderRadius: '20px',
                    padding: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                }}
            >
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, height: '2px', background: color, width: `${progress}%`, boxShadow: `0 0 10px ${color}` }}
                    />
                )}

                <span style={{ fontSize: '10px', fontWeight: '900', color: (isActive || pc.status !== 'free') ? color : '#666' }}>{pc.name}</span>

                <div style={{ margin: '10px 0', fontSize: '14px', fontWeight: 'bold', color: isActive ? '#fff' : '#444' }}>
                    {isActive ? elapsedTime : pc.status.toUpperCase()}
                </div>

                <div style={{
                    width: '6px', height: '6px',
                    background: color,
                    borderRadius: '50%',
                    boxShadow: `0 0 10px ${color}`
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

                        <div style={{ margin: '0 0 20px', padding: '20px', background: 'linear-gradient(45deg, #111, #000)', borderRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #7000ff33' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', margin: 0, color: '#fff', letterSpacing: '2px' }}>KLUB XARITASI 🗺️</h2>
                                <p style={{ fontSize: '10px', color: '#888', margin: '5px 0 0' }}>Jami xonalar: {rooms.length} ta</p>
                            </div>
                            <button onClick={() => setShowAddRoom(true)} style={{ background: '#7000ff', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 0 15px rgba(112,0,255,0.4)', cursor: 'pointer' }}>
                                + YANGI XONA
                            </button>
                        </div>

                        {rooms.map(room => (
                            <div key={room.id} style={{ marginBottom: '35px', background: '#050505', borderRadius: '30px', padding: '20px', border: '1px solid #111' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#7000ff', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                        <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>{room.Computers?.length} ta PC • Yoniq: <span style={{ color: '#ff00ff' }}>{room.Computers?.filter(c => c.status === 'busy').length}</span></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#00ffff' }}>{room.pricePerHour.toLocaleString()} UZS/s</span>
                                    </div>
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

            {/* PC ACTION MODAL */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'flex-end' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedPC(null); }}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                            style={{ background: '#111', width: '100%', padding: '30px', borderRadius: '40px 40px 0 0', borderTop: '1px solid #333' }}
                        >
                            <h2 style={{ fontSize: '24px', margin: '0 0 5px', textAlign: 'center' }}>{selectedPC.name} Boshqaruvi</h2>
                            <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', margin: '0 0 30px' }}>Hozirgi holat: <b style={{ color: selectedPC.status === 'busy' ? '#ff00ff' : '#39ff14' }}>{selectedPC.status.toUpperCase()}</b></p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {selectedPC.status !== 'busy' && (
                                    <button onClick={() => handleAction('start')} disabled={actionLoading} style={{ background: '#39ff14', color: '#000', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                        ⏳ VAQT OCHISH (START)
                                    </button>
                                )}
                                {selectedPC.status === 'busy' && (
                                    <button onClick={() => handleAction('stop')} disabled={actionLoading} style={{ background: '#ff4444', color: '#fff', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                        🛑 VAQT TO'XTATISH
                                    </button>
                                )}
                                <button onClick={() => handleAction('reserve')} disabled={actionLoading} style={{ background: '#ffaa00', color: '#000', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                    🎫 BRON QILISH
                                </button>
                                <button onClick={() => handleAction('vip')} disabled={actionLoading} style={{ background: '#00ffff', color: '#000', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                    💎 VIP QILISH
                                </button>
                                <button onClick={() => handleAction('free')} disabled={actionLoading} style={{ background: '#333', color: '#fff', padding: '20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px', gridColumn: 'span 2' }}>
                                    🧹 KOMPYUTERNI BO'SHATISH
                                </button>
                            </div>
                            <button onClick={() => setSelectedPC(null)} style={{ width: '100%', padding: '15px', background: 'transparent', color: '#666', border: 'none', marginTop: '20px', fontSize: '14px' }}>YOPISH</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD ROOM MODAL */}
            <AnimatePresence>
                {showAddRoom && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            style={{ background: '#111', width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '30px', border: '1px solid #333' }}
                        >
                            <h2 style={{ fontSize: '20px', margin: '0 0 20px', color: '#fff', textAlign: 'center' }}>+ YANGI XONA 🎮</h2>

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Xona nomi (Masalan: VIP Xona):</label>
                            <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Soatiga narxi (UZS):</label>
                            <input type="number" value={newRoom.pricePerHour} onChange={e => setNewRoom({ ...newRoom, pricePerHour: parseInt(e.target.value) })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Nechta PC joylashgan:</label>
                            <input type="number" value={newRoom.pcCount} onChange={e => setNewRoom({ ...newRoom, pcCount: parseInt(e.target.value) })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>PC parametrlari (Qisqacha):</label>
                            <input value={newRoom.pcSpecs} onChange={e => setNewRoom({ ...newRoom, pcSpecs: e.target.value })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '25px' }} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowAddRoom(false)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>BEKOR QILISH</button>
                                <button onClick={handleAddRoom} disabled={actionLoading} style={{ flex: 1, padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>+{actionLoading ? '...' : 'QO\'SHISH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ManagerDashboard;
