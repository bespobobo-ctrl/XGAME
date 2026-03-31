import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send, History, LayoutGrid, Users } from 'lucide-react';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    const [stats, setStats] = useState({ rooms: 0, total: 0, free: 0, busy: 0 });
    const [pcDetail, setPcDetail] = useState(null);
    const [openRoomId, setOpenRoomId] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    const [topupAmount, setTopupAmount] = useState('10000');
    const [receiptFile, setReceiptFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const clubName = profileData?.user?.clubName || 'GAME ZONE';
    const userName = profileData?.user?.name || user?.username || 'Gamer';

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [profRes, mapRes] = await Promise.all([
                callAPI(`/api/player/me?t=${timestamp}`),
                callAPI(`/api/player/rooms?t=${timestamp}`)
            ]);
            if (profRes.success) setProfileData(profRes);
            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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
            const computers = r.Computers || [];
            computers.forEach(pc => {
                total++;
                if (pc.status === 'free' || pc.status === 'available') free++;
                else busy++;
            });
        });
        setStats({ rooms: rooms.length, total, free, busy });
    };

    const handleReserve = async (pcId) => {
        if (!reserveTimeInput) return alert("Vaqtni tanlang!");
        setReserveLoading(true);
        try {
            const res = await callAPI(`/api/player/pc/${pcId}/reserve`, {
                method: 'POST',
                body: JSON.stringify({ reserveTime: reserveTimeInput })
            });
            if (res.success) {
                alert('Muvaffaqiyatli bron qilindi! 🎉');
                setPcDetail(null);
                fetchData();
            } else { alert(res.error || res.message); }
        } catch (error) { alert('Xatolik yuz berdi'); }
        finally { setReserveLoading(false); }
    };

    const navItem = (id, label, icon) => (
        <div onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#666', cursor: 'pointer', transition: '0.3s' }}>
            <span style={{ fontSize: '22px' }}>{icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{label}</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', paddingBottom: '120px', minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '900' }}>{clubName.toUpperCase()}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%' }} />
                        <p style={{ color: '#555', margin: 0, fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>ONLINE</p>
                    </div>
                </div>
                <button onClick={onLogout} style={{ background: '#ff444415', color: '#ff4444', border: 'none', padding: '10px 18px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px' }}>LOGOUT</button>
            </header>

            <AnimatePresence mode='wait'>
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* 🌟 USER HEADER */}
                        <div>
                            <h3 style={{ margin: 0, fontSize: '13px', color: '#444', fontWeight: 'bold' }}>XUSH KELIBSIZ,</h3>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', letterSpacing: '-1px' }}>{userName} ✨</h2>
                        </div>

                        {/* 📊 CLUB LIVE STATS (ROOMS, FREE, BUSY) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[
                                { l: 'XONALAR', v: stats.rooms, i: <LayoutGrid size={16} />, c: '#7000ff' },
                                { l: 'BO\'SH PC', v: stats.free, i: <Monitor size={16} />, c: '#39ff14' },
                                { l: 'BAND PC', v: stats.busy, i: <Users size={16} />, c: '#ff00ff' }
                            ].map((item, i) => (
                                <div key={i} style={{ background: '#111', padding: '15px 10px', borderRadius: '22px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                                    <div style={{ color: item.c, marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>{item.i}</div>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{item.v}</h4>
                                    <p style={{ margin: 0, fontSize: '8px', color: '#444', fontWeight: 'bold' }}>{item.l}</p>
                                </div>
                            ))}
                        </div>

                        {/* 💰 BALANCE CARD */}
                        <div style={{ background: 'linear-gradient(135deg, #111, #080808)', borderRadius: '30px', padding: '30px', border: '1px solid #1a1a1a', position: 'relative', overflow: 'hidden shadow-2xl' }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#7000ff', filter: 'blur(60px)', opacity: 0.2 }} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#7000ff', fontWeight: 'bold', letterSpacing: '1px' }}>HISOBINGIZ</p>
                            <h2 style={{ margin: '10px 0 25px', fontSize: '42px', fontWeight: '950' }}>{profileData?.user?.balance?.toLocaleString()} <span style={{ fontSize: '14px', color: '#444' }}>UZS</span></h2>
                            <button onClick={() => setActiveTab('topup')} style={{ width: '100%', padding: '18px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '14px' }}>+ BALANSNI TO'LDIRISH</button>
                        </div>

                        {/* 🕒 RECENT COMPUTERS (LAST 3) */}
                        <div style={{ background: '#111', borderRadius: '30px', padding: '25px', border: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <History size={18} color="#7000ff" />
                                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>OXIRGI O'TIRGAN PC-LAR</h4>
                            </div>
                            {(() => {
                                const sessions = profileData?.user?.Sessions || [];
                                const recentUniquePCs = [];
                                const seenIds = new Set();
                                for (let s of sessions) {
                                    if (s.Computer && !seenIds.has(s.Computer.id)) {
                                        recentUniquePCs.push(s.Computer);
                                        seenIds.add(s.Computer.id);
                                    }
                                    if (recentUniquePCs.length >= 3) break;
                                }

                                if (recentUniquePCs.length === 0) return <p style={{ fontSize: '12px', color: '#444', textAlign: 'center' }}>Hali foydalanilmagan</p>;

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {recentUniquePCs.map(pc => {
                                            const status = (pc.status || '').toLowerCase();
                                            const isFree = status === 'free' || status === 'available';
                                            return (
                                                <div key={pc.id} style={{ background: '#000', padding: '15px 20px', borderRadius: '22px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <Monitor size={20} color={isFree ? '#39ff14' : '#ff00ff'} />
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '900' }}>{pc.name}</div>
                                                            <div style={{ fontSize: '9px', color: isFree ? '#39ff14' : '#ff00ff', fontWeight: 'bold' }}>{isFree ? 'HOZIR BO\'SH' : 'HOZIR BAND'}</div>
                                                        </div>
                                                    </div>
                                                    {isFree && <button onClick={() => setPcDetail(pc)} style={{ background: '#39ff1415', color: '#39ff14', border: 'none', padding: '8px 15px', borderRadius: '12px', fontSize: '11px', fontWeight: '900' }}>BRON QILISH</button>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'map' && (
                    <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '10px' }}>KOMPYUTERLAR XARITASI</h2>
                        {roomsData.map(room => (
                            <div key={room.id} style={{ background: '#111', borderRadius: '30px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                                <div onClick={() => setOpenRoomId(openRoomId === room.id ? null : room.id)} style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3>
                                        <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#555', fontWeight: 'bold' }}>{room.pricePerHour.toLocaleString()} UZS/SOAT</p>
                                    </div>
                                    <ChevronRight style={{ transform: openRoomId === room.id ? 'rotate(90deg)' : 'none', transition: '0.3s' }} color="#333" />
                                </div>
                                <AnimatePresence>
                                    {openRoomId === room.id && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', padding: '0 20px 25px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px' }}>
                                                {room.Computers?.map(pc => {
                                                    const status = (pc.status || '').toLowerCase();
                                                    const isAvailable = status === 'free' || status === 'available';
                                                    return (
                                                        <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setPcDetail(pc)} style={{ background: '#000', border: `1px solid ${isAvailable ? '#39ff1422' : '#ff00ff22'}`, borderRadius: '20px', padding: '18px 5px', textAlign: 'center', cursor: 'pointer' }}>
                                                            <Monitor size={26} color={isAvailable ? '#39ff14' : '#ff00ff'} style={{ filter: `drop-shadow(0 0 5px ${isAvailable ? '#39ff1444' : '#ff00ff44'})` }} />
                                                            <div style={{ fontSize: '11px', fontWeight: '900', marginTop: '8px' }}>{pc.name}</div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'topup' && (
                    <motion.div key="topup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => setActiveTab('profile')} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft size={20} /></button>
                            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>HISOBNI TO'LDIRISH</h2>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #111, #050505)', borderRadius: '30px', padding: '30px', border: '1px solid #1a1a1a' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '12px', color: '#7000ff', fontWeight: 'bold' }}>TO'LOV MA'LUMOTLARI</h4>
                            <div style={{ background: '#000', padding: '25px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #1a1a1a' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#444', fontWeight: 'bold', marginBottom: '8px' }}>KARTA RAQAMI:</p>
                                <h4 style={{ fontSize: '20px', letterSpacing: '2px', fontWeight: '900', margin: 0 }}>{profileData?.club?.cardNumber || 'MA\'LUMOT YO\'Q'}</h4>
                                <p style={{ margin: '15px 0 0', fontSize: '13px', fontWeight: 'bold', color: '#888' }}>EGASI: {profileData?.club?.cardOwner || 'MA\'LUMOT YO\'Q'}</p>
                            </div>
                            <div style={{ marginBottom: '25px' }}><label style={{ fontSize: '11px', color: '#444', marginBottom: '8px', display: 'block' }}>O'TKAZILGAN SUMMA:</label><input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} style={{ width: '100%', padding: '20px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '20px', color: '#fff', fontSize: '22px', fontWeight: '900' }} /></div>
                            <div style={{ marginBottom: '30px' }}><label style={{ fontSize: '11px', color: '#444', marginBottom: '8px', display: 'block' }}>CHEKNI YUKLASH:</label>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, zIndex: 10 }} />
                                    <div style={{ padding: '30px', background: receiptFile ? '#39ff1408' : '#000', border: `2px dashed ${receiptFile ? '#39ff14' : '#1a1a1a'}`, borderRadius: '25px', textAlign: 'center' }}>
                                        {receiptFile ? <div style={{ color: '#39ff14', fontWeight: 'bold' }}>✅ {receiptFile.name}</div> : <div style={{ color: '#444' }}><ImageIcon size={28} style={{ marginBottom: '10px' }} /><br />GALEREYADAN TANLASH</div>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSubmitTopUp} disabled={uploading} style={{ width: '100%', padding: '22px', background: '#7000ff', color: '#fff', borderRadius: '22px', fontWeight: '950', fontSize: '16px' }}>{uploading ? 'YUKLANMOQDA...' : 'TASDIQLASHGA YUBORISH'}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🕒 RESERVATION MODAL (MAP & HISTORY) */}
            <AnimatePresence>
                {pcDetail && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => e.target === e.currentTarget && setPcDetail(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#111', width: '100%', padding: '35px 25px', borderRadius: '40px 40px 0 0', borderTop: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <div><h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950' }}>{pcDetail.name}</h2><p style={{ margin: 0, fontSize: '12px', color: (pcDetail.status || '').toLowerCase().includes('free') || (pcDetail.status || '').toLowerCase().includes('available') ? '#39ff14' : '#ff00ff', fontWeight: 'bold' }}>{(pcDetail.status || 'O\'CHIQ').toUpperCase()}</p></div>
                                <button onClick={() => setPcDetail(null)} style={{ background: '#222', border: 'none', color: '#fff', padding: '12px', borderRadius: '15px' }}><X size={22} /></button>
                            </div>

                            {((pcDetail.status || '').toLowerCase() === 'free' || (pcDetail.status || '').toLowerCase() === 'available') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#444', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>BRON QILISH VAQTINI TANLANG:</label>
                                        <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '25px', background: '#000', border: '2px solid #1a1a1a', borderRadius: '25px', color: '#fff', fontSize: '36px', textAlign: 'center', fontWeight: '900', fontFamily: 'monospace' }} />
                                    </div>
                                    <button onClick={() => handleReserve(pcDetail.id)} disabled={reserveLoading} style={{ width: '100%', padding: '25px', background: '#39ff14', color: '#000', borderRadius: '25px', fontWeight: '950', fontSize: '18px' }}>{reserveLoading ? 'YUBORILMOQDA...' : 'BRON QILISH ✅'}</button>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', padding: '30px', color: '#444', fontWeight: 'bold' }}>Ushbu PC hozirda band. Iltimos boshqasini tanlang.</p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(18,18,18,0.85)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px 25px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                {navItem('profile', 'Asosiy', <LayoutGrid size={24} />)}
                {navItem('map', 'Xarita', <Monitor size={24} />)}
                {navItem('topup', 'Hisob', <CreditCard size={24} />)}
            </nav>
        </motion.div>
    );
};

export default UserDashboard;
