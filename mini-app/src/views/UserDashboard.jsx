import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // profile, map

    // Stats calculations
    const [stats, setStats] = useState({ total: 0, free: 0, busy: 0, vips: [] });

    // Reservation state
    const [selectedPC, setSelectedPC] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    // Detail state for busy PC
    const [pcDetail, setPcDetail] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [profRes, mapRes] = await Promise.all([
                    callAPI('/api/player/me'),
                    callAPI('/api/player/rooms')
                ]);
                if (profRes.success) setProfileData(profRes);
                if (mapRes.success) {
                    setRoomsData(mapRes.rooms);
                    calculateStats(mapRes.rooms);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateStats = (rooms) => {
        let total = 0, free = 0, busy = 0, vips = [];
        rooms.forEach(r => {
            if (r.Computers) {
                r.Computers.forEach(pc => {
                    total++;
                    if (pc.status === 'free') free++;
                    else {
                        busy++;
                        const sess = pc.Sessions && pc.Sessions[0];
                        if (pc.type === 'vip') {
                            vips.push({
                                name: pc.name,
                                guest: sess?.guestName || 'Gamer',
                                since: sess?.startTime ? new Date(sess.startTime) : null
                            });
                        }
                    }
                });
            }
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
                const mapRes = await callAPI('/api/player/rooms');
                if (mapRes.success) {
                    setRoomsData(mapRes.rooms);
                    calculateStats(mapRes.rooms);
                }
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
        const diff = Math.floor((new Date() - new Date(sinceDate)) / 60000); // minutes
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
            style={{ padding: '20px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100vh', background: '#000' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '900', color: '#fff' }}>CABINET</h2>
                    <p style={{ color: activeTab === 'profile' ? '#00ffcc' : '#ff00aa', margin: 0, fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>
                        {activeTab === 'profile' ? 'GAMER PROFILE' : 'KLUB XARITASI'}
                    </p>
                </div>
                <button
                    onClick={onLogout}
                    style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.3)', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px' }}
                >
                    CHIQISH
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#00ffcc' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: '40px', marginBottom: '10px' }}>⏳</motion.div>
                    Yuklanmoqda...
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                            {/* LIVE CLUB STATUS */}
                            <motion.div
                                style={{ background: 'rgba(20, 20, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '25px', padding: '20px', marginBottom: '20px', backdropFilter: 'blur(10px)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0, fontSize: '13px', color: '#fff', opacity: 0.8 }}>⚡ KLUB STATUS</h3>
                                    <div style={{ height: '8px', width: '8px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>JAMI PC</p>
                                        <h4 style={{ margin: '5px 0 0', color: '#fff' }}>{stats.total}</h4>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>BO'SH</p>
                                        <h4 style={{ margin: '5px 0 0', color: '#39ff14' }}>{stats.free}</h4>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>BAND</p>
                                        <h4 style={{ margin: '5px 0 0', color: '#ff4444' }}>{stats.busy}</h4>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ID Card */}
                            <motion.div
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.15) 0%, rgba(112, 0, 255, 0.15) 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '25px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)', position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, #00ffcc 0%, transparent 70%)', opacity: 0.2, filter: 'blur(20px)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: '900' }}>{profileData?.user?.name || user?.username}</h3>
                                        <p style={{ margin: '5px 0 0', color: '#00ffcc', fontSize: '12px', fontWeight: 'bold' }}>{profileData?.user?.clubName?.toUpperCase()}</p>
                                    </div>
                                    <div style={{ background: '#00ffcc', color: '#000', padding: '5px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' }}>VIP MEMBER</div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>HISOB (UZS)</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '20px', color: '#00ffcc' }}>{profileData?.user?.balance?.toLocaleString() || 0}</h4>
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>DARAJA</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '18px', color: '#fff' }}>Lv. 1</h4>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                            {roomsData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '50px', background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🗺️</div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Xonalar topilmadi.<br />Klubda xonalar sozlanmagan bo'lishi mumkin.</p>
                                </div>
                            ) : (
                                roomsData.map(room => (
                                    <div key={room.id} style={{ marginBottom: '25px', background: 'rgba(20,20,20,0.8)', padding: '20px', borderRadius: '25px', border: '1px solid rgba(255,0,170,0.2)' }}>
                                        <h3 style={{ margin: '0 0 20px', color: '#ff00aa', fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '12px' }}>
                                            {room.Computers?.map(pc => {
                                                const isBusy = pc.status === 'busy' || pc.status === 'paused';
                                                const isReserved = pc.status === 'reserved';
                                                const color = isBusy ? '#ff4444' : (isReserved ? '#ffaa00' : '#39ff14');
                                                const sess = pc.Sessions && pc.Sessions[0];

                                                return (
                                                    <motion.div
                                                        key={pc.id}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            if (!isBusy && !isReserved) setSelectedPC(pc);
                                                            else setPcDetail(pc);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}44`,
                                                            borderRadius: '18px', padding: '15px 10px', textAlign: 'center', position: 'relative'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>{pc.type === 'vip' ? '💎' : '🖥️'}</div>
                                                        <div style={{ color, fontWeight: 'bold', fontSize: '13px' }}>{pc.name}</div>
                                                        {isBusy && (
                                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>
                                                                {getTimeDiff(sess?.startTime)}
                                                            </div>
                                                        )}
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

            {/* PC Detail Modal */}
            <AnimatePresence>
                {pcDetail && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '30px', border: '1px solid #7000ff', textAlign: 'center' }}>
                            <div style={{ fontSize: '40px', marginBottom: '15px' }}>{pcDetail.type === 'vip' ? '💎' : '🖥️'}</div>
                            <h3 style={{ margin: '0 0 5px', color: '#fff', fontSize: '24px' }}>PC: {pcDetail.name}</h3>
                            <p style={{ color: pcDetail.status === 'busy' ? '#ff4444' : '#ffaa00', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px' }}>
                                {pcDetail.status.toUpperCase()}
                            </p>

                            {pcDetail.Sessions && pcDetail.Sessions[0] && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>O'yinchi: <span style={{ color: '#fff', fontWeight: 'bold' }}>{pcDetail.Sessions[0].guestName || 'Gamer'}</span></p>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Boshladi: <span style={{ color: '#fff' }}>{new Date(pcDetail.Sessions[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>O'ynadi: <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{getTimeDiff(pcDetail.Sessions[0].startTime)}</span></p>
                                    {pcDetail.Sessions[0].expectedMinutes && (
                                        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Qoldi: <span style={{ color: '#ff00aa', fontWeight: 'bold' }}>{getRemainingTime(pcDetail.Sessions[0])}</span></p>
                                    )}
                                </div>
                            )}
                            <button onClick={() => setPcDetail(null)} style={{ width: '100%', marginTop: '25px', background: 'linear-gradient(90deg, #7000ff, #00ffcc)', border: 'none', padding: '15px', borderRadius: '15px', color: '#000', fontWeight: '900', fontSize: '14px' }}>YOPISH</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <motion.nav
                style={{ position: 'fixed', bottom: '25px', left: '25px', right: '25px', background: 'rgba(15, 15, 15, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '30px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
            >
                <div onClick={() => setView('home')} style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🏠</span> Home
                </div>
                <div onClick={() => setActiveTab('profile')} style={{ color: activeTab === 'profile' ? '#00ffcc' : 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '10px', transition: '0.3s' }}>
                    <span style={{ fontSize: '20px' }}>👤</span> Profile
                </div>
                <div onClick={() => setActiveTab('map')} style={{ color: activeTab === 'map' ? '#ff00aa' : 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '10px', transition: '0.3s' }}>
                    <span style={{ fontSize: '20px' }}>🗺️</span> Map
                </div>
            </motion.nav>

            {/* Reservation Modal */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', maxWidth: '320px', padding: '30px', borderRadius: '30px', border: '1px solid #ff00aa', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '22px' }}>BRON QILISH</h3>
                            <p style={{ color: '#ff00aa', fontWeight: 'bold' }}>{selectedPC.name}</p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Kelish vaqti:</label>
                                <input
                                    type="time"
                                    value={reserveTimeInput}
                                    onChange={e => setReserveTimeInput(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '15px', fontSize: '18px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button onClick={() => setSelectedPC(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold' }}>BEKOR</button>
                                <button onClick={handleReserve} disabled={reserveLoading} style={{ flex: 1, background: '#ff00aa', border: 'none', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold', opacity: reserveLoading ? 0.5 : 1 }}>
                                    {reserveLoading ? '...' : 'BRON'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserDashboard;
