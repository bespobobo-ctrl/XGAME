import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // profile, map

    const [stats, setStats] = useState({ total: 0, free: 0, busy: 0 });
    const [selectedPC, setSelectedPC] = useState(null);
    const [pcDetail, setPcDetail] = useState(null);
    const [openRoomId, setOpenRoomId] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    const clubName = profileData?.user?.clubName || 'GAME ZONE';
    const userName = profileData?.user?.name || user?.username || 'Gamer';

    const fetchData = async () => {
        try {
            const [profRes, mapRes] = await Promise.all([
                callAPI('/api/player/me'),
                callAPI('/api/player/rooms')
            ]);
            if (profRes.success) setProfileData(profRes);
            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
                // If only one room, open it by default
                if (mapRes.rooms?.length === 1 && !openRoomId) {
                    setOpenRoomId(mapRes.rooms[0].id);
                }
            } else {
                setError(mapRes.error || mapRes.message || "Ma'lumotlarni yuklab bo'lmadi");
            }
        } catch (err) {
            setError("Server bilan aloqa uzildi! 🔌");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const calculateStats = (rooms) => {
        let total = 0, free = 0, busy = 0;
        if (!Array.isArray(rooms)) return;
        rooms.forEach(r => {
            const computers = r.Computers || r.computers || [];
            computers.forEach(pc => {
                total++;
                if (pc.status === 'free') free++;
                else busy++;
            });
        });
        setStats({ total, free, busy });
    };

    const handleReserve = async () => {
        if (!selectedPC || !reserveTimeInput) return;
        setReserveLoading(true);
        try {
            const res = await callAPI(`/api/player/pc/${selectedPC.id}/reserve`, {
                method: 'POST',
                body: JSON.stringify({ reserveTime: reserveTimeInput })
            });
            if (res.success) {
                alert('Muvaffaqiyatli bron qilindi! 🎉');
                setSelectedPC(null);
                fetchData();
            } else {
                alert(res.error || res.message || 'Xatolik yuz berdi');
            }
        } catch (error) {
            alert('Internet bilan muammo');
        } finally {
            setReserveLoading(false);
        }
    };

    const getTimeDiff = (sinceDate) => {
        if (!sinceDate) return '...';
        const diff = Math.floor((new Date() - new Date(sinceDate)) / 60000);
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} daqiqa`;
    };

    const getRemainingTime = (session) => {
        if (!session || !session.startTime || !session.expectedMinutes) return 'Ochiq qoladi';
        const start = new Date(session.startTime);
        const end = new Date(start.getTime() + session.expectedMinutes * 60000);
        const diff = Math.floor((end - new Date()) / 60000);
        if (diff <= 0) return 'Tugayapti';
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m qoldi` : `${m} daqiqa qoldi`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '20px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
            {/* 🎯 HEADER (Styled identical to screenshot) */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '900', letterSpacing: '-1px', color: '#fff', textTransform: 'uppercase' }}>{clubName}</h1>
                    <p style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.8, textTransform: 'uppercase' }}>MAP VIEW</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={fetchData} style={{ background: '#1c1c1e', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔄</button>
                    <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.05)', color: '#ff3b30', border: 'none', padding: '10px 20px', borderRadius: '14px', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase' }}>Chiqish</button>
                </div>
            </header>

            {loading && roomsData.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #00ffcc', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto' }}></div>
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#888' }}>Xush kelibsiz,</h3>
                                <h2 style={{ margin: 0, fontSize: '32px', color: '#fff', fontWeight: '900' }}>{userName} 🕹️</h2>
                            </div>

                            <div style={{ background: '#1c1c1e', borderRadius: '25px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '12px', color: '#888', fontWeight: '900' }}>HOZIRGI HOLAT</span>
                                    <span style={{ fontSize: '12px', color: '#32d74b' }}>● ONLINE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><p style={{ margin: 0, fontSize: '11px', color: '#555' }}>JAMI</p><h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>{stats.total}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '11px', color: '#555' }}>BO'SH</p><h3 style={{ margin: '5px 0 0', fontSize: '24px', color: '#32d74b' }}>{stats.free}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '11px', color: '#555' }}>BAND</p><h3 style={{ margin: '5px 0 0', fontSize: '24px', color: '#ff3b30' }}>{stats.busy}</h3></div>
                                </div>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, rgba(0,255,204,0.1), rgba(112,0,255,0.1))', borderRadius: '25px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#00ffcc', fontWeight: '900' }}>HISOBINGIZ</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '32px', color: '#fff' }}>{profileData?.user?.balance?.toLocaleString() || 0}<span style={{ fontSize: '14px', marginLeft: '5px' }}>UZS</span></h4>
                                    <span style={{ fontSize: '12px', color: '#888' }}>ID: #{profileData?.user?.id || '...'}</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {roomsData.map(room => {
                                const pcs = room.Computers || room.computers || [];
                                const busyCount = pcs.filter(p => p.status === 'busy' || p.status === 'paused' || p.status === 'reserved').length;
                                const isOpen = openRoomId === room.id;

                                return (
                                    <div key={room.id} style={{ background: '#1c1c1e', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        {/* ROOM ACCORDION HEADER */}
                                        <div
                                            onClick={() => setOpenRoomId(isOpen ? null : room.id)}
                                            style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                        >
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff' }}>{room.name.toUpperCase()}</h3>
                                                {!isOpen && <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#888' }}>{pcs.length} PC • {busyCount} band</p>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {isOpen ? <span style={{ fontSize: '18px', opacity: 0.5 }}>▲</span> : <span style={{ fontSize: '18px', opacity: 0.5 }}>▼</span>}
                                            </div>
                                        </div>

                                        {/* PC GRID (Accordian Content) */}
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    style={{ padding: '0 20px 25px', overflow: 'hidden' }}
                                                >
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '12px', marginTop: '5px' }}>
                                                        {pcs.map(pc => {
                                                            const isBusy = pc.status === 'busy' || pc.status === 'paused';
                                                            const isReserved = pc.status === 'reserved';
                                                            const color = isBusy ? '#ff3b30' : (isReserved ? '#ff9f0a' : '#32d74b');
                                                            const sess = (pc.Sessions || pc.sessions || [])[0];

                                                            return (
                                                                <motion.div
                                                                    key={pc.id} whileTap={{ scale: 0.95 }}
                                                                    onClick={() => {
                                                                        if (!isBusy && !isReserved) setSelectedPC(pc);
                                                                        else setPcDetail(pc);
                                                                    }}
                                                                    style={{
                                                                        background: '#000',
                                                                        border: `1px solid ${color}44`,
                                                                        borderRadius: '20px',
                                                                        padding: '20px 5px',
                                                                        textAlign: 'center',
                                                                        position: 'relative'
                                                                    }}
                                                                >
                                                                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '11px' }}>{pc.name}</div>
                                                                    {isBusy && sess && <div style={{ fontSize: '9px', color: '#888', marginTop: '5px' }}>{getTimeDiff(sess.startTime)}</div>}
                                                                    {!isBusy && !isReserved && <div style={{ fontSize: '9px', color: '#32d74b', marginTop: '5px' }}>Bo'sh</div>}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Modals & Nav remains similar but styled premium */}
            <AnimatePresence>
                {pcDetail && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(15px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#1c1c1e', width: '100%', maxWidth: '300px', padding: '30px', borderRadius: '30px', border: '1px solid #7000ff', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: '900' }}>{pcDetail.name}</h3>
                            <div style={{ display: 'inline-block', padding: '5px 15px', borderRadius: '10px', background: pcDetail.status === 'busy' ? '#ff3b3022' : '#ff9f0a22', color: pcDetail.status === 'busy' ? '#ff453a' : '#ff9f0a', fontSize: '12px', fontWeight: '900', marginBottom: '20px' }}>
                                {pcDetail.status.toUpperCase()}
                            </div>

                            {(pcDetail.Sessions || pcDetail.sessions || [])[0] && (
                                <div style={{ textAlign: 'left', background: '#000', padding: '20px', borderRadius: '20px', fontSize: '14px', marginBottom: '20px' }}>
                                    <p style={{ margin: '0 0 10px', color: '#888' }}>Gamers: <b style={{ color: '#fff' }}>{(pcDetail.Sessions || pcDetail.sessions || [])[0].guestName || 'Gamer'}</b></p>
                                    <p style={{ margin: '0 0 10px', color: '#888' }}>Vaqti: <b style={{ color: '#32d74b' }}>{getTimeDiff((pcDetail.Sessions || pcDetail.sessions || [])[0].startTime)}</b></p>
                                </div>
                            )}

                            {pcDetail.status === 'reserved' && (pcDetail.Sessions || pcDetail.sessions || [])[0]?.UserId === profileData?.user?.id && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Bronni bekor qilasizmi?")) return;
                                        const res = await callAPI(`/api/player/pc/${pcDetail.id}/reserve`, { method: 'DELETE' });
                                        if (res.success) { alert("Bekor qilindi"); setPcDetail(null); fetchData(); }
                                        else alert(res.error || "Xatolik");
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', border: 'none', padding: '15px', borderRadius: '18px', marginBottom: '10px', fontWeight: 'bold' }}
                                >
                                    BEKOR QILISH ❌
                                </button>
                            )}

                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', background: '#7000ff', border: 'none', color: '#fff', padding: '15px', borderRadius: '18px', fontWeight: 'bold' }}>YOPISH</button>
                        </motion.div>
                    </div>
                )}
                {selectedPC && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(15px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#1c1c1e', width: '100%', maxWidth: '300px', padding: '30px', borderRadius: '30px', border: '1px solid #ff00aa', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '24px', fontWeight: '900' }}>BAND QILISH</h3>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff00aa', marginBottom: '20px' }}>{selectedPC.name}</div>
                            <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '18px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '20px', fontSize: '20px', textAlign: 'center' }} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                                <button onClick={() => setSelectedPC(null)} style={{ flex: 1, padding: '15px', borderRadius: '18px', background: '#333', border: 'none', color: '#fff' }}>X</button>
                                <button onClick={handleReserve} disabled={reserveLoading} style={{ flex: 2, padding: '15px', borderRadius: '18px', background: '#ff00aa', border: 'none', color: '#fff', fontWeight: 'bold' }}>OK</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav (Styled identical to screenshot) */}
            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <div onClick={() => setView('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#888', cursor: 'pointer' }}>
                    <span style={{ fontSize: '20px', marginBottom: '2px' }}>🏠</span>
                    <span style={{ fontSize: '10px', fontWeight: '900' }}>Asosiy</span>
                </div>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? '#af52de' : '#888', cursor: 'pointer' }}>
                    <span style={{ fontSize: '20px', marginBottom: '2px' }}>👤</span>
                    <span style={{ fontSize: '10px', fontWeight: '900' }}>Profil</span>
                </div>
                <div onClick={() => setActiveTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'map' ? '#007aff' : '#888', cursor: 'pointer' }}>
                    <span style={{ fontSize: '20px', marginBottom: '2px' }}>🗺️</span>
                    <span style={{ fontSize: '10px', fontWeight: '900' }}>Xarita</span>
                </div>
            </nav>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

export default UserDashboard;
