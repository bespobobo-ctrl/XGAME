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
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);
    const [pcDetail, setPcDetail] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [profRes, mapRes] = await Promise.all([
                callAPI('/api/player/me'),
                callAPI('/api/player/rooms')
            ]);

            if (profRes.success) {
                setProfileData(profRes);
            } else {
                console.error("Profile error:", profRes);
            }

            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
            } else {
                setError(mapRes.message || "Xonalar ro'yxatini yuklab bo'lmadi");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            setError("Server bilan aloqa uzildi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s auto refresh
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
                else {
                    busy++;
                    const sessList = pc.Sessions || pc.sessions || [];
                    const sess = sessList[0];
                    if (pc.type === 'vip') {
                        vips.push({
                            name: pc.name,
                            guest: sess?.guestName || 'Gamer',
                            since: sess?.startTime ? new Date(sess.startTime) : null
                        });
                    }
                }
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '26px', margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>X-GAME</h2>
                    <p style={{ color: activeTab === 'profile' ? '#00ffcc' : '#ff00aa', margin: 0, fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>
                        {activeTab === 'profile' ? 'PROFILE' : 'ROOMS MAP'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '12px' }}>🔄</button>
                    <button onClick={onLogout} style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>CHIQUISH</button>
                </div>
            </div>

            {loading && roomsData.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ border: '3px solid rgba(0,255,204,0.1)', borderTop: '3px solid #00ffcc', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Yuklanmoqda...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {/* LIVE STATUS CARD */}
                            <div style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.9), rgba(10,10,10,0.9))', borderRadius: '25px', padding: '20px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>LIVE STATUS</span>
                                    <span style={{ fontSize: '12px', color: '#39ff14' }}>● Online</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>JAMI PC</p><h3 style={{ margin: '5px 0 0' }}>{stats.total}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>BO'SH</p><h3 style={{ margin: '5px 0 0', color: '#39ff14' }}>{stats.free}</h3></div>
                                    <div><p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>BAND</p><h3 style={{ margin: '5px 0 0', color: '#ff4444' }}>{stats.busy}</h3></div>
                                </div>
                            </div>

                            {/* ID CARD */}
                            <div style={{ background: 'linear-gradient(135deg, #00ffcc22, #7000ff22)', borderRadius: '25px', padding: '25px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ zIndex: 1, position: 'relative' }}>
                                    <h3 style={{ margin: 0, fontSize: '24px' }}>{profileData?.user?.name || user?.username}</h3>
                                    <p style={{ margin: '5px 0 20px', color: '#00ffcc', fontSize: '12px', fontWeight: 'bold' }}>{profileData?.user?.clubName?.toUpperCase()}</p>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px' }}>
                                            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>BALANCE</p>
                                            <h4 style={{ margin: '5px 0 0', color: '#00ffcc' }}>{profileData?.user?.balance?.toLocaleString()}</h4>
                                        </div>
                                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px' }}>
                                            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>LEVEL</p>
                                            <h4 style={{ margin: '5px 0 0' }}>1</h4>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '100px', opacity: 0.05 }}>💎</div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {error && (
                                <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', padding: '15px', borderRadius: '15px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            {roomsData.length === 0 && !loading ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '40px' }}>🗺️</span>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '15px', fontSize: '14px' }}>Xonalar topilmadi. Klubda xonalar sozlanmagan bo'lishi mumkin.</p>
                                    <button onClick={fetchData} style={{ marginTop: '15px', background: '#7000ff', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontSize: '12px' }}>QAYTA YUKLASH</button>
                                </div>
                            ) : (
                                roomsData.map(room => (
                                    <div key={room.id} style={{ marginBottom: '20px', background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid rgba(255,0,170,0.1)' }}>
                                        <h3 style={{ margin: '0 0 15px', color: '#ff00aa', fontSize: '15px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
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
                                                        style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}33`, borderRadius: '15px', padding: '12px 5px', textAlign: 'center' }}
                                                    >
                                                        <div style={{ fontSize: '20px', marginBottom: '5px' }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                        <div style={{ color, fontWeight: 'bold', fontSize: '12px' }}>{pc.name}</div>
                                                        {isBusy && sess && <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{getTimeDiff(sess.startTime)}</div>}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Modals same logic, but cleaner */}
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
                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', background: '#7000ff', border: 'none', color: '#fff', padding: '12px', borderRadius: '12px', marginTop: '15px', fontWeight: 'bold' }}>YOPISH</button>
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
            <div style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(15px)', zIndex: 100 }}>
                <div onClick={() => setView('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px' }}><span>🏠</span> Asosiy</div>
                <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? '#00ffcc' : 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px', fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}><span>👤</span> Profil</div>
                <div onClick={() => setActiveTab('map')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'map' ? '#ff00aa' : 'rgba(255,255,255,0.4)', fontSize: '10px', gap: '3px', fontWeight: activeTab === 'map' ? 'bold' : 'normal' }}><span>🗺️</span> Xarita</div>
            </div>
        </motion.div>
    );
};

export default UserDashboard;
