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
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
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
                if (selectedViewRoom) {
                    const fresh = mapRes.rooms.find(r => r.id === selectedViewRoom.id);
                    if (fresh) setSelectedViewRoom(fresh);
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
    }, [selectedViewRoom?.id]);

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
        return h > 0 ? `${h}s ${m}d` : `${m} daqiqa`;
    };

    const getRemainingTime = (session) => {
        if (!session || !session.startTime || !session.expectedMinutes) return 'Ochiq qoladi';
        const start = new Date(session.startTime);
        const end = new Date(start.getTime() + session.expectedMinutes * 60000);
        const diff = Math.floor((end - new Date()) / 60000);
        if (diff <= 0) return 'Tugayapti';
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}s ${m}d qoldi` : `${m} daqiqa qoldi`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '15px', paddingBottom: '110px', minHeight: '100vh', background: '#050505', color: '#fff' }}
        >
            {/* 💎 PREMIUM HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 5px' }}>
                <div>
                    <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '900', color: '#fff' }}>{clubName.toUpperCase()}</h2>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' }}>GAMER CONTROL</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={fetchData} style={{ background: '#222', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px' }}>🔄</button>
                    <button onClick={onLogout} style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.2)', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px' }}>LOGOUT</button>
                </div>
            </header>

            {loading && roomsData.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ border: '3px solid rgba(0,255,204,0.1)', borderTop: '3px solid #00ffcc', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }}></div>
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '0 5px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Xush kelibsiz,</h3>
                                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: '900' }}>{userName} 🕹️</h2>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #111, #050505)', borderRadius: '30px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '900' }}>STATISTIKA</span>
                                    <span style={{ fontSize: '12px', color: '#39ff14' }}>● LIVE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>JAMI</p><h3 style={{ margin: '5px 0 0', fontSize: '20px' }}>{stats.total}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>BO'SH</p><h3 style={{ margin: '5px 0 0', fontSize: '20px', color: '#39ff14' }}>{stats.free}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>BAND</p><h3 style={{ margin: '5px 0 0', fontSize: '20px', color: '#ff4444' }}>{stats.busy}</h3></div>
                                </div>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #00ffcc11, #7000ff11)', borderRadius: '30px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#00ffcc', fontWeight: '900' }}>BALANS</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                    <h4 style={{ margin: '5px 0 0', fontSize: '24px', color: '#fff' }}>{profileData?.user?.balance?.toLocaleString() || 0} UZS</h4>
                                    <h4 style={{ margin: '5px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>ID: #{profileData?.user?.id || '...'}</h4>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {!selectedViewRoom ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <h3 style={{ fontSize: '14px', color: '#00ffcc', margin: '0 0 5px', fontWeight: 'bold', letterSpacing: '1px' }}>🗺️ XONALARNI TANLANG</h3>
                                    {roomsData.map(room => {
                                        const pcs = room.Computers || room.computers || [];
                                        const busyCount = pcs.filter(p => p.status === 'busy' || p.status === 'paused' || p.status === 'reserved').length;
                                        const availableCount = pcs.length - busyCount;

                                        return (
                                            <motion.div
                                                key={room.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedViewRoom(room)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    padding: '25px',
                                                    borderRadius: '30px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#ff00aa', fontSize: '20px', fontWeight: '900' }}>{room.name.toUpperCase()}</h4>
                                                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                                                        {pcs.length} PC • {room.pricePerHour?.toLocaleString()} UZS/S
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', color: availableCount > 0 ? '#39ff14' : '#666', fontWeight: '900' }}>{availableCount} BO'SH</div>
                                                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>KIRISH →</div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <button
                                            onClick={() => setSelectedViewRoom(null)}
                                            style={{ background: '#222', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '18px', fontSize: '20px' }}
                                        >
                                            ←
                                        </button>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#ff00aa' }}>{selectedViewRoom.name.toUpperCase()}</h3>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Hozirgi holat va bandlik</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '15px' }}>
                                        {(selectedViewRoom.Computers || selectedViewRoom.computers || []).map(pc => {
                                            const isBusy = pc.status === 'busy' || pc.status === 'paused';
                                            const isReserved = pc.status === 'reserved';
                                            const color = isBusy ? '#ff4444' : (isReserved ? '#ffaa00' : '#39ff14');
                                            const sess = (pc.Sessions || pc.sessions || [])[0];

                                            return (
                                                <motion.div
                                                    key={pc.id} whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        if (!isBusy && !isReserved) setSelectedPC(pc);
                                                        else setPcDetail(pc);
                                                    }}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.4)',
                                                        border: `1px solid ${color}33`,
                                                        borderRadius: '25px',
                                                        padding: '20px 5px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '26px', marginBottom: '10px' }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}>{pc.name}</div>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, margin: '10px auto 0', boxShadow: `0 0 10px ${color}` }}></div>
                                                    {isBusy && sess && <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{getTimeDiff(sess.startTime)}</div>}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* PC Detail Modal */}
            <AnimatePresence>
                {pcDetail && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '35px', border: '1px solid #7000ff', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: '900' }}>{pcDetail.name}</h3>
                            <div style={{ display: 'inline-block', padding: '6px 15px', borderRadius: '12px', background: pcDetail.status === 'busy' ? '#ff444422' : '#ffaa0022', color: pcDetail.status === 'busy' ? '#ff4444' : '#ffaa00', fontSize: '13px', fontWeight: '900', marginBottom: '20px' }}>
                                {pcDetail.status.toUpperCase()}
                            </div>

                            {(pcDetail.Sessions || pcDetail.sessions || [])[0] && (
                                <div style={{ textAlign: 'left', background: '#050505', padding: '20px', borderRadius: '25px', fontSize: '14px', marginBottom: '20px', border: '1px solid #222' }}>
                                    <p style={{ margin: '0 0 10px', color: '#777' }}>O'yinchi: <b style={{ color: '#fff' }}>{(pcDetail.Sessions || pcDetail.sessions || [])[0].guestName || 'Gamer'}</b></p>
                                    <p style={{ margin: '0 0 10px', color: '#777' }}>O'ynadi: <b style={{ color: '#39ff14' }}>{getTimeDiff((pcDetail.Sessions || pcDetail.sessions || [])[0].startTime)}</b></p>
                                    {(pcDetail.Sessions || pcDetail.sessions || [])[0].expectedMinutes && <p style={{ margin: 0, color: '#777' }}>Qoldi: <b style={{ color: '#ff00aa' }}>{getRemainingTime((pcDetail.Sessions || pcDetail.sessions || [])[0])}</b></p>}
                                </div>
                            )}

                            {/* CANCEL ONLY IF OWNED */}
                            {pcDetail.status === 'reserved' && (pcDetail.Sessions || pcDetail.sessions || [])[0]?.UserId === profileData?.user?.id && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Bronni bekor qilasizmi?")) return;
                                        const res = await callAPI(`/api/player/pc/${pcDetail.id}/reserve`, { method: 'DELETE' });
                                        if (res.success) { alert("Bekor qilindi"); setPcDetail(null); fetchData(); }
                                        else alert(res.error || "Xatolik");
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4444', padding: '15px', borderRadius: '18px', marginBottom: '10px', fontWeight: 'bold' }}
                                >
                                    BRONNI BEKOR QILISH ❌
                                </button>
                            )}

                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', background: '#7000ff', border: 'none', color: '#fff', padding: '15px', borderRadius: '18px', fontWeight: 'bold' }}>YOPISH</button>
                        </motion.div>
                    </div>
                )}
                {selectedPC && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '35px', border: '1px solid #ff00aa', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '24px', fontWeight: '900' }}>BAND QILISH</h3>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff00aa', marginBottom: '20px' }}>{selectedPC.name}</div>
                            <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '18px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '20px', fontSize: '20px', textAlign: 'center', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                                <button onClick={() => setSelectedPC(null)} style={{ flex: 1, padding: '15px', borderRadius: '18px', background: '#222', border: 'none', color: '#fff', fontWeight: 'bold' }}>X</button>
                                <button onClick={handleReserve} disabled={reserveLoading} style={{ flex: 2, padding: '15px', borderRadius: '18px', background: '#ff00aa', border: 'none', color: '#fff', fontWeight: 'bold' }}>BAND QILISH</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav style={{ position: 'fixed', bottom: '15px', left: '15px', right: '15px', background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,1)' }}>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? '#00ffcc' : '#555', fontSize: '10px', gap: '5px', fontWeight: '900', cursor: 'pointer' }}>
                    <span style={{ fontSize: '22px' }}>👤</span> PROFIL
                </div>
                <div onClick={() => setActiveTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'map' ? '#ff00aa' : '#555', fontSize: '10px', gap: '5px', fontWeight: '900', cursor: 'pointer' }}>
                    <span style={{ fontSize: '22px' }}>🗺️</span> XARITA
                </div>
            </nav>
        </motion.div>
    );
};

export default UserDashboard;
