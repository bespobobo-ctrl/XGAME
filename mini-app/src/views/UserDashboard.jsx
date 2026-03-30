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
        const interval = setInterval(fetchData, 15000);
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
            style={{ padding: '15px', paddingBottom: '100px', minHeight: '100vh', background: '#050505', color: '#fff' }}
        >
            {/* 💎 PREMIUM HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 5px' }}>
                <div>
                    <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '900', color: '#fff' }}>{clubName.toUpperCase()}</h2>
                    <p style={{ color: '#aaa', margin: 0, fontSize: '12px', fontWeight: 'bold' }}>MAP VIEW 🗺️</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={fetchData} style={{ background: '#222', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>🔄</button>
                    <button onClick={onLogout} style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.2)', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px' }}>CHIQUISH</button>
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
                                <h3 style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Salom,</h3>
                                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', fontWeight: '900' }}>{userName} 🕹️</h2>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #111, #050505)', borderRadius: '30px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '900' }}>ONLINE STATUS</span>
                                    <span style={{ fontSize: '12px', color: '#39ff14' }}>● LIVE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>JAMI</p><h3 style={{ margin: '5px 0 0', fontSize: '20px' }}>{stats.total}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>BO'SH</p><h3 style={{ margin: '5px 0 0', fontSize: '20px', color: '#39ff14' }}>{stats.free}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: '#666' }}>BAND</p><h3 style={{ margin: '5px 0 0', fontSize: '20px', color: '#ff4444' }}>{stats.busy}</h3></div>
                                </div>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #00ffcc11, #7000ff11)', borderRadius: '30px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#00ffcc', fontWeight: '900' }}>MABLAG'</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>BALANS</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '22px', color: '#fff' }}>{profileData?.user?.balance?.toLocaleString() || 0} UZS</h4>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#aaa' }}>ID</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '18px', color: '#fff' }}>#{profileData?.user?.id || '...'}</h4>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {roomsData.map(room => (
                                <div key={room.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 5px 20px rgba(0,0,0,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>{room.pricePerHour?.toLocaleString()} UZS / S</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '12px' }}>
                                        {(room.Computers || room.computers || []).map(pc => {
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
                                                        borderRadius: '22px',
                                                        padding: '18px 5px',
                                                        textAlign: 'center',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ fontSize: '24px', marginBottom: '8px', filter: `drop-shadow(0 0 5px ${color}44)` }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                    <div style={{ color: '#fff', fontWeight: '900', fontSize: '11px', letterSpacing: '0.5px' }}>{pc.name}</div>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, margin: '8px auto 0', boxShadow: `0 0 8px ${color}` }}></div>
                                                    {isBusy && sess && <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>{getTimeDiff(sess.startTime)}</div>}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* PC Detail Modal */}
            <AnimatePresence>
                {pcDetail && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '35px', border: '1px solid #7000ff', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '22px' }}>{pcDetail.name}</h3>
                            <div style={{ display: 'inline-block', padding: '5px 15px', borderRadius: '10px', background: pcDetail.status === 'busy' ? '#ff444422' : '#ffaa0022', color: pcDetail.status === 'busy' ? '#ff4444' : '#ffaa00', fontSize: '12px', fontWeight: '900', marginBottom: '20px' }}>
                                {pcDetail.status.toUpperCase()}
                            </div>

                            {(pcDetail.Sessions || pcDetail.sessions || [])[0] && (
                                <div style={{ textAlign: 'left', background: '#050505', padding: '20px', borderRadius: '20px', fontSize: '14px', marginBottom: '20px', border: '1px solid #222' }}>
                                    <p style={{ margin: '0 0 10px', color: '#888' }}>O'yinchi: <b style={{ color: '#fff' }}>{(pcDetail.Sessions || pcDetail.sessions || [])[0].guestName || 'Gamer'}</b></p>
                                    <p style={{ margin: '0 0 10px', color: '#888' }}>O'ynadi: <b style={{ color: '#39ff14' }}>{getTimeDiff((pcDetail.Sessions || pcDetail.sessions || [])[0].startTime)}</b></p>
                                    {(pcDetail.Sessions || pcDetail.sessions || [])[0].expectedMinutes && <p style={{ margin: 0, color: '#888' }}>Qoldi: <b style={{ color: '#ff00aa' }}>{getRemainingTime((pcDetail.Sessions || pcDetail.sessions || [])[0])}</b></p>}
                                </div>
                            )}

                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', background: '#7000ff', border: 'none', color: '#fff', padding: '15px', borderRadius: '18px', fontWeight: 'bold', fontSize: '14px' }}>YOPISH</button>
                        </motion.div>
                    </div>
                )}
                {selectedPC && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', backdropFilter: 'blur(10px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '35px', border: '1px solid #ff00aa', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '900' }}>BRON QILISH</h3>
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ fontSize: '30px', marginBottom: '5px' }}>{selectedPC.type === 'vip' ? '💎' : '🖥️'}</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff00aa' }}>{selectedPC.name}</div>
                            </div>
                            <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '18px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '20px', fontSize: '18px', textAlign: 'center', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                                <button onClick={() => setSelectedPC(null)} style={{ flex: 1, padding: '15px', borderRadius: '18px', background: '#222', border: 'none', color: '#fff', fontWeight: 'bold' }}>BEKOR</button>
                                <button onClick={handleReserve} disabled={reserveLoading} style={{ flex: 1, padding: '15px', borderRadius: '18px', background: '#ff00aa', border: 'none', color: '#fff', fontWeight: 'bold' }}>BAND QILISH</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <nav style={{ position: 'fixed', bottom: '15px', left: '15px', right: '15px', background: 'rgba(15,15,15,0.9)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '30px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,1)' }}>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? '#00ffcc' : '#555', fontSize: '10px', gap: '5px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}>
                    <span style={{ fontSize: '20px' }}>👤</span>
                    PROFIL
                </div>
                <div onClick={() => setActiveTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'map' ? '#ff00aa' : '#555', fontSize: '10px', gap: '5px', fontWeight: '900', cursor: 'pointer', transition: '0.3s' }}>
                    <span style={{ fontSize: '20px' }}>🗺️</span>
                    XARITA
                </div>
            </nav>
        </motion.div>
    );
};

export default UserDashboard;
