import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // profile, map

    const [stats, setStats] = useState({ total: 0, free: 0, busy: 0, vips: [] });
    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [pcDetail, setPcDetail] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    const clubName = profileData?.user?.clubName || 'GAME ZONE';
    const userName = profileData?.user?.name || user?.username || 'Gamer';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [profRes, mapRes] = await Promise.all([
                callAPI('/api/player/me'),
                callAPI('/api/player/rooms')
            ]);
            if (profRes.success) setProfileData(profRes);
            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
                // Update selected room if visible
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
    }, []);

    const calculateStats = (rooms) => {
        let total = 0, free = 0, busy = 0, vips = [];
        if (!Array.isArray(rooms)) return;

        rooms.forEach(r => {
            const computers = r.Computers || r.computers || [];
            computers.forEach(pc => {
                total++;
                if (pc.status === 'free') free++;
                else busy++;
            });
        });
        setStats({ total, free, busy, vips });
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
            style={{ padding: '20px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '100vh', background: '#050505', color: '#fff' }}
        >
            {/* 💎 SMART HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '900', letterSpacing: '-1px', color: '#00ffcc', textShadow: '0 0 15px rgba(0,255,204,0.3)' }}>{clubName.toUpperCase()}</h2>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>GAMER PANEL</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px' }}>🔄</button>
                    <button onClick={onLogout} style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>CHIQISH</button>
                </div>
            </header>

            {loading && roomsData.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ border: '3px solid rgba(0,255,204,0.1)', borderTop: '3px solid #00ffcc', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Yuklanmoqda...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ marginBottom: '5px' }}>
                                <h3 style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Xush kelibsiz,</h3>
                                <h2 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>{userName} 🎮</h2>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.9), rgba(10,10,10,0.9))', borderRadius: '25px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>KLUB STATUSI</span>
                                    <span style={{ fontSize: '12px', color: '#39ff14' }}>● Online</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>JAMI PC</p><h3 style={{ margin: '5px 0 0' }}>{stats.total}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>BO'SH</p><h3 style={{ margin: '5px 0 0', color: '#39ff14' }}>{stats.free}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>BAND</p><h3 style={{ margin: '5px 0 0', color: '#ff4444' }}>{stats.busy}</h3></div>
                                </div>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #00ffcc11, #7000ff11)', borderRadius: '25px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#00ffcc' }}>HISOB</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>BALANCE</p>
                                        <h4 style={{ margin: '3px 0 0', color: '#fff' }}>{profileData?.user?.balance?.toLocaleString() || 0} UZS</h4>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>MEMBER ID</p>
                                        <h4 style={{ margin: '3px 0 0', color: '#fff' }}>#{profileData?.user?.id || '...'}</h4>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ marginTop: '10px' }}>
                            {!selectedViewRoom ? (
                                <>
                                    <h3 style={{ fontSize: '14px', color: '#00ffcc', margin: '0 0 15px', letterSpacing: '2px', fontWeight: 'bold' }}>🗺️ XONALARNI TANLANG</h3>
                                    {roomsData.map(room => {
                                        const pcs = room.Computers || room.computers || [];
                                        const busyCount = pcs.filter(p => p.status === 'busy' || p.status === 'paused').length;
                                        const freeCount = pcs.length - busyCount;

                                        return (
                                            <motion.div
                                                key={room.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedViewRoom(room)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    marginBottom: '12px',
                                                    padding: '20px',
                                                    borderRadius: '25px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#ff00aa', fontSize: '18px', fontWeight: '900' }}>{room.name.toUpperCase()}</h4>
                                                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{pcs.length} PC • {room.pricePerHour?.toLocaleString()} UZS/s</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '10px', color: '#39ff14', fontWeight: 'bold' }}>{freeCount} BO'SH</div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>DAVOM ETISH →</div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </>
                            ) : (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                        <button
                                            onClick={() => setSelectedViewRoom(null)}
                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '15px', fontSize: '18px' }}
                                        >
                                            ←
                                        </button>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '20px', color: '#ff00aa' }}>{selectedViewRoom.name.toUpperCase()}</h3>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Xonadagi kompyuterlar holati</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                                        {(selectedViewRoom.Computers || selectedViewRoom.computers || []).map(pc => {
                                            const isBusy = pc.status === 'busy' || pc.status === 'paused';
                                            const isReserved = pc.status === 'reserved';
                                            const color = isBusy ? '#ff4444' : (isReserved ? '#ffaa00' : '#39ff14');
                                            const sessList = pc.Sessions || pc.sessions || [];
                                            const sess = sessList[0];

                                            return (
                                                <motion.div
                                                    key={pc.id} whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        if (!isBusy && !isReserved) setSelectedPC(pc);
                                                        else setPcDetail(pc);
                                                    }}
                                                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}33`, borderRadius: '20px', padding: '15px 5px', textAlign: 'center', boxShadow: isBusy ? `0 0 10px ${color}11` : 'none' }}
                                                >
                                                    <div style={{ fontSize: '22px', marginBottom: '5px' }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                    <div style={{ color, fontWeight: 'bold', fontSize: '12px' }}>{pc.name}</div>
                                                    {isBusy && sess && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>{getTimeDiff(sess.startTime)}</div>}
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
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: '#151515', width: '100%', maxWidth: '300px', padding: '25px', borderRadius: '25px', border: '1px solid #7000ff', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 5px' }}>PC: {pcDetail.name}</h3>
                            <p style={{ color: pcDetail.status === 'busy' ? '#ff4444' : '#ffaa00', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>{pcDetail.status.toUpperCase()}</p>
                            {(pcDetail.Sessions || pcDetail.sessions || [])[0] && (
                                <div style={{ textAlign: 'left', background: '#222', padding: '15px', borderRadius: '15px', fontSize: '13px' }}>
                                    <p style={{ margin: '0 0 8px' }}>O'yinchi: <b>{(pcDetail.Sessions || pcDetail.sessions || [])[0].guestName || 'Gamer'}</b></p>
                                    <p style={{ margin: '0 0 8px' }}>O'ynadi: <b style={{ color: '#00ffcc' }}>{getTimeDiff((pcDetail.Sessions || pcDetail.sessions || [])[0].startTime)}</b></p>
                                    {(pcDetail.Sessions || pcDetail.sessions || [])[0].expectedMinutes && <p style={{ margin: 0 }}>Qoldi: <b style={{ color: '#ff00aa' }}>{getRemainingTime((pcDetail.Sessions || pcDetail.sessions || [])[0])}</b></p>}
                                </div>
                            )}
                            {pcDetail.status === 'reserved' && (
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Bronni bekor qilmoqchimisiz?")) return;
                                        const res = await callAPI(`/api/player/pc/${pcDetail.id}/reserve`, { method: 'DELETE' });
                                        if (res.success) { alert("Bron bekor qilindi"); setPcDetail(null); fetchData(); }
                                        else alert(res.error || "Xato yuz berdi");
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4444', padding: '12px', borderRadius: '12px', marginTop: '10px', fontWeight: 'bold', fontSize: '12px' }}
                                >
                                    BRONNI BEKOR QILISH ❌
                                </button>
                            )}
                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', background: '#7000ff', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', marginTop: '10px', fontWeight: 'bold' }}>YOPISH</button>
                        </motion.div>
                    </div>
                )}
                {selectedPC && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: '#151515', width: '100%', maxWidth: '300px', padding: '25px', borderRadius: '25px', border: '1px solid #ff00aa', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 15px' }}>BRON QILISH</h3>
                            <p style={{ color: '#ff00aa', fontWeight: 'bold' }}>{selectedPC.name}</p>
                            <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '15px', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '15px', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setSelectedPC(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#333', border: 'none', color: '#fff' }}>Bekor</button>
                                <button onClick={handleReserve} disabled={reserveLoading} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ff00aa', border: 'none', color: '#fff', fontWeight: 'bold' }}>OK</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(15px)', zIndex: 100 }}>
                <div onClick={() => setView('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px', cursor: 'pointer' }}><span>🏠</span> Asosiy</div>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? '#00ffcc' : 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', cursor: 'pointer' }}><span>👤</span> Profil</div>
                <div onClick={() => setActiveTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'map' ? '#ff00aa' : 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px', fontWeight: activeTab === 'map' ? 'bold' : 'normal', cursor: 'pointer' }}><span>🗺️</span> Xarita</div>
            </nav>
        </motion.div>
    );
};

export default UserDashboard;
