import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);

    const [showAddRoom, setShowAddRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });

    const [showEditRoom, setShowEditRoom] = useState(null);

    const handleEditRoom = async () => {
        if (!showEditRoom.name) return alert('Xona nomi kerak');
        setActionLoading(true);
        try {
            await callAPI(`/api/manager/room/${showEditRoom.id}`, {
                method: 'PUT',
                body: JSON.stringify(showEditRoom)
            });
            const r = await callAPI('/api/manager/rooms');
            setRooms(r || []);
            setShowEditRoom(null);
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleDeleteRoom = async () => {
        if (!showEditRoom) return;
        if (!window.confirm(`Haqiqatan ham "${showEditRoom.name}" xonasini va undagi barcha PC-larni o'chirib yubormoqchimisiz?`)) return;

        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/room/${showEditRoom.id}`, {
                method: 'DELETE'
            });
            if (res.success) {
                const r = await callAPI('/api/manager/rooms');
                setRooms(r || []);
                setShowEditRoom(null);
                alert('Xona o\'chirildi');
            } else {
                alert(res.error || 'Xatolik yuz berdi');
            }
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

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

        const getStatusTheme = () => {
            if (pc.status === 'free' || pc.status === 'available') return { color: '#39ff14', icon: <Monitor size={28} strokeWidth={1.5} />, label: 'BO\'SH' };
            if (pc.status === 'busy') return { color: '#ff00ff', icon: <MonitorPlay size={28} strokeWidth={2} />, label: elapsedTime };
            if (pc.status === 'reserved') return { color: '#ffaa00', icon: <CalendarClock size={28} strokeWidth={1.5} />, label: 'BRON' };
            if (pc.status === 'vip') return { color: '#00ffff', icon: <Crown size={28} strokeWidth={1.5} />, label: 'VIP' };
            return { color: '#444', icon: <PowerOff size={28} strokeWidth={1.5} />, label: 'O\'CHIQ' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div
                key={pc.id}
                whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${color}44` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPC(pc)}
                style={{
                    background: `linear-gradient(145deg, #111, #050505)`,
                    border: `1px solid ${isActive ? color + '66' : '#222'}`,
                    borderTop: `2px solid ${isActive ? color : '#333'}`,
                    borderRadius: '20px',
                    padding: '20px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 10px 30px ${color}22` : 'none'
                }}
            >
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%`, boxShadow: `0 0 15px ${color}` }}
                    />
                )}

                <div style={{ color: color, marginBottom: '10px', filter: `drop-shadow(0 0 8px ${color}66)` }}>
                    {icon}
                </div>

                <span style={{ fontSize: '12px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{pc.name}</span>

                <div style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 'bold', color: isActive ? color : '#666', background: isActive ? `${color}11` : 'transparent', padding: '4px 10px', borderRadius: '8px' }}>
                    {label}
                </div>
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

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms-list" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ padding: '20px' }}>

                        <div style={{ margin: '0 0 20px', padding: '20px', background: 'linear-gradient(45deg, #111, #000)', borderRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #7000ff33' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', margin: 0, color: '#fff', letterSpacing: '2px' }}>KLUB XARITASI 🗺️</h2>
                                <p style={{ fontSize: '10px', color: '#888', margin: '5px 0 0' }}>Jami xonalar: {rooms.length} ta</p>
                            </div>
                            <button onClick={() => setShowAddRoom(true)} style={{ background: '#7000ff', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 0 15px rgba(112,0,255,0.4)', cursor: 'pointer' }}>
                                + YANGI XONA
                            </button>
                        </div>

                        {rooms.map((room, index) => {
                            let roomRevenue = 0;
                            let roomHours = 0;
                            stats?.pcStats?.forEach(pcStat => {
                                if (pcStat.roomId === room.id) {
                                    roomRevenue += pcStat.revenue;
                                    roomHours += pcStat.hours;
                                }
                            });
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={room.id}
                                    style={{ marginBottom: '20px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)', borderRadius: '30px', padding: '15px 20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '15px', cursor: 'pointer' }}
                                    whileHover={{ scale: 1.01, border: '1px solid rgba(112,0,255,0.5)' }}
                                    onClick={() => setSelectedViewRoom(room)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'linear-gradient(135deg, #7000ff, #39ff14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', margin: 0, boxShadow: '0 0 15px rgba(112,0,255,0.3)', color: '#fff' }}>
                                                {room.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '10px', background: '#222', padding: '3px 6px', borderRadius: '6px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '3px' }}><Monitor size={10} /> {room.Computers?.length} PC</span>
                                                    <span style={{ fontSize: '10px', background: 'rgba(255,0,255,0.1)', color: '#ff00ff', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(255,0,255,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}><MonitorPlay size={10} /> BANT: {room.Computers?.filter(c => c.status === 'busy').length}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowEditRoom(room); }}
                                            style={{ background: '#222', border: 'none', color: '#fff', padding: '8px', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Pencil size={16} color="#888" />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', padding: '12px 15px', borderRadius: '18px', border: '1px solid #1a1a1a' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>IsH VAQTI (Bugun)</div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#39ff14' }}>{roomHours.toFixed(1)} SOAT</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>DAROMAD (Bugun)</div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ffff' }}>{roomRevenue.toLocaleString()} UZS</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} color="#7000ff" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} style={{ padding: '20px' }}>

                        <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => {
                                setSelectedViewRoom(null);
                                // optional: refresh rooms dynamically
                                callAPI('/api/manager/rooms').then(r => setRooms(r || []));
                            }} style={{ width: '45px', height: '45px', borderRadius: '15px', background: '#111', border: '1px solid #333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 style={{ fontSize: '24px', margin: 0, color: '#fff', letterSpacing: '1px' }}>{selectedViewRoom.name.toUpperCase()}</h2>
                                <p style={{ fontSize: '12px', color: '#00ffff', margin: '4px 0 0' }}>{selectedViewRoom.pricePerHour.toLocaleString()} UZS / SOATIGA</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                            {/* ensure to find the latest computers from state just in case */}
                            {(rooms.find(r => r.id === selectedViewRoom.id)?.Computers || selectedViewRoom.Computers)?.map(pc => renderPC(pc, selectedViewRoom))}
                        </div>

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
                                <button onClick={() => setShowAddRoom(false)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>BEKOR QILISH</button>
                                <button onClick={handleAddRoom} disabled={actionLoading} style={{ flex: 1, padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>+{actionLoading ? '...' : 'QO\'SHISH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT ROOM MODAL */}
            <AnimatePresence>
                {showEditRoom && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            style={{ background: '#111', width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '30px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '18px', margin: 0, color: '#fff' }}>⚙️ XONANI SOZLASH</h2>
                                <button onClick={handleDeleteRoom} style={{ background: '#ff444422', border: 'none', color: '#ff4444', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>XONA NOMI</label>
                            <input value={showEditRoom.name} onChange={e => setShowEditRoom({ ...showEditRoom, name: e.target.value })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', marginBottom: '15px', fontSize: '14px' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>SOATIGA (UZS)</label>
                                    <input type="number" value={showEditRoom.pricePerHour} onChange={e => setShowEditRoom({ ...showEditRoom, pricePerHour: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>PC SONI</label>
                                    <input type="number" value={showEditRoom.pcCount} onChange={e => setShowEditRoom({ ...showEditRoom, pcCount: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '14px' }} />
                                </div>
                            </div>

                            <div style={{ background: '#080808', padding: '15px', borderRadius: '20px', border: '1px solid #1a1a1a', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lock size={14} color={showEditRoom.isLocked ? '#ff4444' : '#666'} />
                                        <span style={{ fontSize: '12px', color: '#fff' }}>Vaqt bo'yicha qulflash</span>
                                    </div>
                                    <input type="checkbox" checked={showEditRoom.isLocked} onChange={e => setShowEditRoom({ ...showEditRoom, isLocked: e.target.checked })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', marginBottom: '3px', display: 'block' }}>OCHILISH</label>
                                        <input type="time" value={showEditRoom.openTime} onChange={e => setShowEditRoom({ ...showEditRoom, openTime: e.target.value })} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', marginBottom: '3px', display: 'block' }}>YOPILISH</label>
                                        <input type="time" value={showEditRoom.closeTime} onChange={e => setShowEditRoom({ ...showEditRoom, closeTime: e.target.value })} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '8px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowEditRoom(null)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>BEKOR</button>
                                <button onClick={handleEditRoom} disabled={actionLoading} style={{ flex: 1, padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>{actionLoading ? '...' : 'SAQLASH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ManagerDashboard;
