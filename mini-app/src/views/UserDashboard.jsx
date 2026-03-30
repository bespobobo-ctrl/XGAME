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

    useEffect(() => {
        const fetchData = async () => {
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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const calculateStats = (rooms) => {
        let total = 0, free = 0, busy = 0, vips = [];
        rooms.forEach(r => {
            r.Computers.forEach(pc => {
                total++;
                if (pc.status === 'free') free++;
                else {
                    busy++;
                    if (pc.type === 'vip') {
                        const sess = pc.Sessions && pc.Sessions[0];
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
        const diff = Math.floor((new Date() - sinceDate) / 60000); // minutes
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}s ${m}d` : `${m} daqiqa`;
    };

    const qrValue = user?.telegramId ? `tg_${user.telegramId}` : `user_${user?.id}`;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '20px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '900', color: '#fff' }}>CABINET</h2>
                    <p style={{ color: activeTab === 'profile' ? '#00ffcc' : '#ff00aa', margin: 0, fontSize: '13px', letterSpacing: '2px', fontWeight: 'bold' }}>
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
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#00ffcc' }}>Yuklanmoqda... ⏳</div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' ? (
                        <motion.div key="profile" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>

                            {/* LIVE CLUB STATUS (New Prominent Card) */}
                            <motion.div
                                style={{ background: 'rgba(20, 20, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '25px', padding: '20px', marginBottom: '20px', backdropFilter: 'blur(10px)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', opacity: 0.8 }}>⚡ KLUB STATUS</h3>
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

                                {stats.vips.length > 0 && (
                                    <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(112, 0, 255, 0.05)', borderRadius: '15px', border: '1px solid rgba(112, 0, 255, 0.1)' }}>
                                        <p style={{ margin: '0 0 8px', color: '#7000ff', fontSize: '10px', fontWeight: 'bold' }}>💎 VIP ZONADA O'YINDA:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {stats.vips.map((v, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                                    <span style={{ color: '#fff' }}>{v.name} ({v.guest})</span>
                                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{getTimeDiff(v.since)} dan beri</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* ID Card */}
                            <motion.div
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(112, 0, 255, 0.1) 100%)',
                                    border: '1px solid rgba(0, 255, 204, 0.3)',
                                    borderRadius: '25px',
                                    padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px',
                                    boxShadow: '0 10px 40px rgba(0, 255, 204, 0.1)', position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, #00ffcc 0%, transparent 70%)', opacity: 0.2, filter: 'blur(20px)' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: '900' }}>{profileData?.user?.name || user?.username}</h3>
                                        <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{profileData?.user?.clubName?.toUpperCase()}</p>
                                    </div>
                                    <div style={{ background: '#00ffcc', color: '#000', padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                                        VIP MEMBER
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px' }}>HISOB (UZS)</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '20px', color: '#00ffcc' }}>{profileData?.user?.balance?.toLocaleString() || 0}</h4>
                                    </div>
                                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px' }}>DARAJA</p>
                                        <h4 style={{ margin: '5px 0 0', fontSize: '18px', color: '#fff' }}>Lv. 1</h4>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px' }}>
                                            <div style={{ width: '30%', height: '100%', background: '#00ffcc', borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: '#fff', height: '40px', width: '100%', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px', boxSizing: 'border-box', opacity: 0.8 }}>
                                    {[...Array(30)].map((_, i) => (
                                        <div key={i} style={{ width: Math.random() * 4 + 1 + 'px', height: '80%', background: '#000' }}></div>
                                    ))}
                                </div>
                                <p style={{ margin: 0, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>{qrValue.toUpperCase()}</p>
                            </motion.div>

                            <div style={{ marginTop: '20px' }}>
                                <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>⏱️</span> Oxirgi O'yinlar
                                </h3>

                                {profileData?.recentSessions?.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {profileData.recentSessions.map(session => (
                                            <div key={session.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>{session.pc.toUpperCase()}</h4>
                                                    <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                                        {new Date(session.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <h4 style={{ margin: 0, color: '#00ffcc', fontSize: '15px' }}>{session.duration} daq</h4>
                                                    <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                                        -{session.cost?.toLocaleString() || 0} sum
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Hali hech qanday o'yin tarixi yo'q.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="map" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                            {roomsData.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '30px' }}>Xonalar mavjud emas</p>
                            ) : (
                                roomsData.map(room => (
                                    <div key={room.id} style={{ marginBottom: '25px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,0,170,0.1)' }}>
                                        <h3 style={{ margin: '0 0 15px', color: '#ff00aa', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                            {room.name.toUpperCase()}
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{room.Computers.length} ta PC</span>
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
                                            {room.Computers.map(pc => {
                                                let bgColor = 'rgba(255,255,255,0.05)';
                                                let textColor = '#fff';
                                                let borderColor = 'rgba(255,255,255,0.1)';

                                                if (pc.status === 'busy' || pc.status === 'paused') {
                                                    bgColor = 'rgba(255, 68, 68, 0.1)';
                                                    textColor = '#ff4444';
                                                    borderColor = 'rgba(255, 68, 68, 0.3)';
                                                } else if (pc.status === 'reserved') {
                                                    bgColor = 'rgba(255, 170, 0, 0.1)';
                                                    textColor = '#ffaa00';
                                                    borderColor = 'rgba(255, 170, 0, 0.3)';
                                                } else { // free
                                                    bgColor = 'rgba(57, 255, 20, 0.1)';
                                                    textColor = '#39ff14';
                                                    borderColor = 'rgba(57, 255, 20, 0.3)';
                                                }

                                                return (
                                                    <motion.div
                                                        key={pc.id}
                                                        whileTap={{ scale: pc.status === 'free' ? 0.9 : 1 }}
                                                        onClick={() => {
                                                            if (pc.status === 'free') {
                                                                setSelectedPC(pc);
                                                                const nextHour = new Date(new Date().getTime() + 60 * 60000);
                                                                setReserveTimeInput(`${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`);
                                                            } else {
                                                                alert(`Bu PC hozir ${pc.status === 'reserved' ? "bron qilingan" : "band"}`);
                                                            }
                                                        }}
                                                        style={{
                                                            background: bgColor, border: `1px solid ${borderColor}`,
                                                            borderRadius: '15px', padding: '15px 5px', textAlign: 'center',
                                                            cursor: pc.status === 'free' ? 'pointer' : 'not-allowed',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '20px' }}>🖥️</div>
                                                        <div style={{ color: textColor, fontWeight: 'bold', fontSize: '13px' }}>{pc.name}</div>
                                                        <div style={{ color: textColor, fontSize: '9px', opacity: 0.7 }}>
                                                            {pc.status === 'free' ? "BO'SH" : (pc.status === 'reserved' ? 'BRON' : 'BAND')}
                                                        </div>
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

            {/* Bottom Navigation for Dashboard */}
            <motion.nav
                initial={{ y: 100 }} animate={{ y: 0 }}
                style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100 }}
            >
                <div onClick={() => setView('home')} style={{ fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🏠</span> Asosiy
                </div>
                <div onClick={() => setActiveTab('profile')} style={{ fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'profile' ? '#00ffcc' : 'rgba(255,255,255,0.4)', transition: '0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>👤</span> Profil
                </div>
                <div onClick={() => setActiveTab('map')} style={{ fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', color: activeTab === 'map' ? '#ff00aa' : 'rgba(255,255,255,0.4)', transition: '0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '20px' }}>🗺️</span> Xarita
                </div>
            </motion.nav>

            {/* Reservation Modal */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
                            style={{ background: '#111', width: '100%', maxWidth: '350px', borderRadius: '25px', padding: '25px', border: '1px solid rgba(255,0,170,0.3)', boxShadow: '0 10px 40px rgba(255,0,170,0.2)' }}
                        >
                            <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '20px', textAlign: 'center' }}>BRON QILISH</h3>
                            <p style={{ margin: '0 0 20px', color: '#ff00aa', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>{selectedPC.name} kompyuteri</p>

                            <label style={{ display: 'block', marginBottom: '15px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '5px', display: 'block' }}>Kutish vaqti (Kelish vaqtingiz):</span>
                                <input
                                    type="time"
                                    value={reserveTimeInput}
                                    onChange={e => setReserveTimeInput(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '16px' }}
                                />
                            </label>

                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: '1.5', margin: '0 0 20px' }}>
                                Siz bron qilganingizdan so'ng, ushbu kompyuter siz belgilagan vaqtdan boshlab sizga tayyor bo'ladi.
                            </p>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setSelectedPC(null)}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    BEKOR QILISH
                                </button>
                                <button
                                    onClick={handleReserve}
                                    disabled={reserveLoading || !reserveTimeInput}
                                    style={{ flex: 1, background: 'linear-gradient(90deg, #ff00aa, #7000ff)', border: 'none', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold', cursor: reserveLoading ? 'wait' : 'pointer', opacity: reserveLoading ? 0.5 : 1 }}
                                >
                                    {reserveLoading ? '...' : 'TASDIQLASH'}
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
