import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 🛰️ CDN Socket (Build safe)
const loadSocket = async () => {
    try {
        const { io } = await import('https://cdn.socket.io/4.7.2/socket.io.esm.min.js');
        return io;
    } catch (e) { return null; }
};

import { callAPI, API_URL } from '../api';
import { Monitor, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, BellRing, Activity, Banknote, Phone, Contact2, History, Pause, Square, Power, DollarSign, Timer } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowTime, setNowTime] = useState(Date.now());

    // UI Tracking
    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [startAmountInput, setStartAmountInput] = useState('');
    const [globalAlert, setGlobalAlert] = useState(null);

    // Reservation Fields
    const [isReserveMode, setIsReserveMode] = useState(false);
    const [resName, setResName] = useState('');
    const [resPhone, setResPhone] = useState('');
    const [resTime, setResTime] = useState('');

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [s, r] = await Promise.all([
                callAPI(`/api/manager/stats?t=${timestamp}`),
                callAPI(`/api/manager/rooms?t=${timestamp}`)
            ]);
            if (s && !s.error) setStats(s);
            if (Array.isArray(r)) setRooms(r);

            if (selectedPC) {
                const pcList = (Array.isArray(r) ? r : []).flatMap(rm => rm.Computers || []);
                const freshPC = pcList.find(p => p.id === selectedPC.id);
                if (freshPC) {
                    const room = (Array.isArray(r) ? r : []).find(rm => rm.id === freshPC.RoomId);
                    setSelectedPC({ ...freshPC, roomPrice: room?.pricePerHour || 15000 });
                }
            }
        } catch (err) { console.error("Sync error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 4000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);

        let socket = null;
        loadSocket().then(io => {
            if (io) {
                socket = io(API_URL || 'https://server.respect-game.uz', { transports: ['websocket'] });
                socket.on('upcoming-alert', (data) => {
                    setGlobalAlert(data);
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(() => { });
                    setTimeout(() => setGlobalAlert(null), 15000);
                });
                socket.on('pc-status-updated', fetchData);
            }
        });

        return () => { clearInterval(dataInterval); clearInterval(timerInterval); if (socket) socket.disconnect(); };
    }, [activeTab]);

    const formatTashkentTime = (dateStr) => {
        if (!dateStr) return '--:--';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tashkent', hour12: false
            }).format(date);
        } catch (e) { return '--:--'; }
    };

    const calculateSessionInfo = (pc, roomPrice = 15000) => {
        if (!pc) return { time: "00:00:00", cost: 0, progress: 0, startTime: null };
        const price = roomPrice || 15000;
        const sessions = pc.Sessions || [];
        const activeSession = sessions.find(s => s.status === 'active' || s.status === 'paused' || s.status === 'reserved');

        if (!activeSession) return { time: "00:00:00", cost: 0, progress: 0, startTime: null };

        const sTime = activeSession.startTime ? formatTashkentTime(activeSession.startTime) : null;
        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);

        if (activeSession.status === 'reserved') {
            return { time: '--:--', cost: 0, progress: 0, reservedInfo: { time: activeSession.reserveTime, user: activeSession.guestName || 'Mehmon' }, startTime: null };
        }

        const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSeconds % 60).toString().padStart(2, '0');
        const elapsedStr = `${h}:${m}:${s}`;

        if (activeSession.expectedMinutes) {
            const totalSeconds = activeSession.expectedMinutes * 60;
            const remainingSec = Math.max(0, totalSeconds - diffSeconds);
            const rh = Math.floor(remainingSec / 3600).toString().padStart(2, '0');
            const rm = Math.floor((remainingSec % 3600) / 60).toString().padStart(2, '0');
            const rs = (remainingSec % 60).toString().padStart(2, '0');
            return { time: `${rh}:${rm}:${rs}`, cost, isCountdown: true, startTime: sTime, elapsed: elapsedStr };
        } else {
            return { time: elapsedStr, cost, isCountdown: false, startTime: sTime, elapsed: elapsedStr };
        }
    };

    const handleAction = async (action, expectedMinutes = null) => {
        if (!selectedPC || actionLoading) return;
        if (action === 'reserve' && (!resName || !resPhone || !resTime)) { alert("Ism, Tel va Vaqtni кiрiting!"); return; }

        setActionLoading(true);
        let finalMinutes = expectedMinutes;
        const amount = parseInt(startAmountInput);
        if (action === 'start' && !expectedMinutes && amount > 0) {
            finalMinutes = Math.floor((amount / selectedPC.roomPrice) * 60);
        }

        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST', body: JSON.stringify({
                    action,
                    expectedMinutes: finalMinutes,
                    reserveTime: resTime,
                    guestName: resName,
                    guestPhone: resPhone
                })
            });
            if (res.success) {
                fetchData();
                setSelectedPC(null); setStartAmountInput(''); setIsReserveMode(false);
                setResName(''); setResPhone(''); setResTime('');
            } else { alert(res.error || "Xatolik!"); }
        } catch (e) { alert("Xatolik!"); }
        finally { setActionLoading(false); }
    };

    const navItem = (id, label, icon) => (
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#555', gap: '4px', cursor: 'pointer', position: 'relative' }}>
            {activeTab === id && (<motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />)}
            <div style={{ padding: '6px', borderRadius: '12px', background: activeTab === id ? 'rgba(112, 0, 255, 0.1)' : 'transparent' }}>{icon}</div>
            <span style={{ fontSize: '8px', fontWeight: '900', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '110px', fontFamily: '"Outfit", sans-serif', overflowX: 'hidden' }}>
            <style>
                {`
                .vibrant-btn-label { color: #ffffff !important; opacity: 1 !important; text-shadow: 0 0 2px #fff; }
                .neon-purple { color: #b480ff !important; opacity: 1 !important; text-shadow: 0 0 10px rgba(180,128,255,0.4); }
                .neon-green { color: #39ff14 !important; opacity: 1 !important; text-shadow: 0 0 10px rgba(57,255,20,0.4); }
                .res-input { width: 100%; padding: 18px 15px 18px 50px; background: #111; border: 1px solid #222; border-radius: 20px; color: #fff; font-size: 16px; margin-bottom: 12px; font-weight: 950; outline: none; }
                .premium-box { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); border-radius: 45px; }
                `}
            </style>

            <AnimatePresence>
                {globalAlert && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '15px', right: '15px', zIndex: 5000, background: 'linear-gradient(90deg, #7000ff, #000)', padding: '20px', borderRadius: '30px', border: '1px solid #fff', boxShadow: '0 20px 60px rgba(112,0,255,0.5)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#fff', borderRadius: '50%', padding: '10px', color: '#7000ff' }}><BellRing size={24} /></div>
                        <div style={{ flex: 1 }}><b style={{ fontSize: '16px', display: 'block', color: '#fff' }}>BRON OGOHLANTIRISH! 🚨</b><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}><b>PC: {globalAlert.pcName}</b> • {globalAlert.guestName} ({globalAlert.rTime}) келяпти!</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '18px', background: '#7000ff', borderRadius: '3px', boxShadow: '0 0 10px #7000ff' }} />
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '950', letterSpacing: '-0.3px' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()}</h1>
                </div>
                <button onClick={onLogout} style={{ background: 'rgba(255, 68, 68, 0.08)', color: '#ff4444', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,68,68,0.15)', fontSize: '10px', fontWeight: '950' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
                        <div style={{ background: 'linear-gradient(145deg, #0e0e0e, #050505)', padding: '40px 20px', borderRadius: '40px', textAlign: 'center', marginBottom: '15px', border: '1px solid rgba(112, 0, 255, 0.1)', position: 'relative' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: '4px' }}>DAILY REVENUE</p>
                            <h2 style={{ fontSize: '56px', fontWeight: '950', margin: '5px 0', color: '#fff' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(57, 255, 20, 0.1)', padding: '6px 12px', borderRadius: '10px', color: '#39ff14', fontSize: '9px', fontWeight: '950' }}> <Activity size={10} /> LIVE MONITORING </div>
                        </div>

                        {stats?.upcomingReservations?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '10px' }}><CalendarClock size={16} color="#ffaa00" /><h3 style={{ fontSize: '12px', fontWeight: '950', margin: 0 }}>YAQIN ORADAGI BRONLAR</h3></div>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {stats.upcomingReservations.map(res => (
                                        <div key={res.id} style={{ minWidth: '220px', background: res.isUrgent ? 'rgba(255,170,0,0.1)' : '#0a0a0a', border: `1px solid ${res.isUrgent ? '#ffaa00' : 'rgba(255,255,255,0.05)'}`, padding: '18px', borderRadius: '25px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><b style={{ fontSize: '12px', color: '#fff' }}>{res.user}</b><span style={{ fontSize: '10px', color: res.isUrgent ? '#ffaa00' : '#888', fontWeight: '950' }}>{res.pc}</span></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} color="#ffaa00" /><b style={{ fontSize: '16px', color: '#fff' }}>{formatTashkentTime(res.time)}</b></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}><DashItem label="NAQD KASSA" icon={<Coins size={12} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} /></div>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}><DashItem label="ONLINE" icon={<Zap size={12} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} /></div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}><h1 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>XONALAR</h1><motion.button onClick={() => setShowAddRoomModal(true)} style={{ background: 'linear-gradient(45deg, #7000ff, #a000ff)', padding: '10px 18px', borderRadius: '16px', border: 'none', color: '#fff', fontWeight: '950', fontSize: '11px' }}><Plus size={14} /> QO'SHISH</motion.button></div>
                        {rooms.map(room => {
                            const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                            const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                            const free = (room.Computers?.length || 0) - busy - reserved;
                            return (
                                <motion.div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: '#090909', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div><h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{room.name?.toUpperCase()}</h3><p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>{room.pricePerHour.toLocaleString()} UZS/SOAT</p></div>
                                        <div style={{ display: 'flex', gap: '6px' }}><RoomBtn icon={room.isLocked ? <Unlock size={14} /> : <Lock size={14} />} color={room.isLocked ? '#39ff14' : '#ffee32'} onClick={e => { e.stopPropagation(); callAPI(`/api/manager/room/${room.id}/lock`, { method: 'POST' }).then(fetchData); }} /><RoomBtn icon={<Trash2 size={14} />} color="#ff4444" onClick={e => { e.stopPropagation(); if (window.confirm("O'chirish?")) callAPI(`/api/manager/room/${room.id}`, { method: 'DELETE' }).then(fetchData); }} /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px', margin: '15px 0' }}><div style={{ height: '4px', background: '#ff00ff', flex: busy || 0.05, borderRadius: '4px', opacity: busy > 0 ? 1 : 0.1 }} /><div style={{ height: '4px', background: '#ffaa00', flex: reserved || 0.05, borderRadius: '4px', opacity: reserved > 0 ? 1 : 0.1 }} /><div style={{ height: '4px', background: '#39ff14', flex: free || 0.05, borderRadius: '4px', opacity: free > 0 ? 1 : 0.1 }} /></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: '12px' }}><MiniStat color="#ff00ff" count={busy} /><MiniStat color="#ffaa00" count={reserved} /><MiniStat color="#39ff14" count={free} /></div><b style={{ fontSize: '14px', color: '#39ff14' }}>{room.todayRevenue?.toLocaleString()} UZS</b></div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}><button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0a0a0a', width: '45px', height: '45px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}><ArrowLeft size={20} /></button><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>{selectedViewRoom.name?.toUpperCase()}</h1></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '12px' }}>
                            {selectedViewRoom.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, selectedViewRoom.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? '#ff00ff' : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#222';
                                return (
                                    <motion.div key={pc.id} whileTap={{ scale: 0.94 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: '#090909', border: `1px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.03)'}`, borderRadius: '24px', padding: '18px 8px', textAlign: 'center' }}><b style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{pc.name}</b><span style={{ fontSize: '9px', color: (s !== 'free') ? theme : '#555', fontWeight: '900' }}>{s === 'free' ? 'BO\'SH' : info.time}</span></motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🖥 🚀 CLUBTIMER PRO MODAL (DESIGN REDESIGN) */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(30px)' }} onClick={() => { setSelectedPC(null); setIsReserveMode(false); }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#080808', width: '100%', padding: '30px 25px 60px', borderRadius: '55px 55px 0 0', borderTop: '2px solid rgba(112, 0, 255, 0.4)', boxShadow: '0 -20px 60px rgba(112,0,255,0.2)' }} onClick={e => e.stopPropagation()}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                                <div><h1 style={{ margin: 0, fontSize: '38px', fontWeight: '950', letterSpacing: '-2px', color: '#fff' }}>{selectedPC.name}</h1><p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>ADMIN CONTROL</p></div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '8px', color: '#555', margin: 0, fontWeight: '950' }}>REAL TIME</p><b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{formatTashkentTime(new Date(nowTime))}</b></div>
                                    <button onClick={() => { setSelectedPC(null); setIsReserveMode(false); }} style={{ background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', borderRadius: '18px', border: 'none', color: '#fff' }}><X size={26} /></button>
                                </div>
                            </div>

                            {isReserveMode ? (
                                <div key="reserve-form">
                                    <div style={{ position: 'relative' }}> <Contact2 style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={20} /> <input className="res-input" placeholder="Mijoz ismi" value={resName} onChange={e => setResName(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Phone style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={20} /> <input className="res-input" placeholder="Telefon" value={resPhone} onChange={e => setResPhone(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Clock style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={20} /> <input className="res-input" type="time" value={resTime} onChange={e => setResTime(e.target.value)} /> </div>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('reserve')} style={{ width: '100%', padding: '25px', borderRadius: '30px', background: 'linear-gradient(45deg, #ffaa00, #ff8800)', color: '#000', border: 'none', fontSize: '18px', fontWeight: '950' }}>BRONNI BAND QILISH 🔓</motion.button>
                                    <button onClick={() => setIsReserveMode(false)} style={{ width: '100%', color: '#444', background: 'transparent', border: 'none', marginTop: '15px', fontWeight: '950', fontSize: '13px' }}>ORQAGA</button>
                                </div>
                            ) : (
                                <>
                                    {selectedPC.status === 'free' ? (
                                        <div key="free-ui">
                                            <div style={{ position: 'relative', marginBottom: '25px', background: '#000', borderRadius: '35px', padding: '35px 20px', border: '1px solid #111' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', opacity: 0.3 }}><Banknote size={16} /><span style={{ fontSize: '10px', fontWeight: '950', letterSpacing: '5px' }}>SUMMA KIRITING</span></div>
                                                <input type="number" placeholder="0" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#39ff14', fontSize: '66px', fontWeight: '950', outline: 'none', letterSpacing: '-2px' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
                                                <QuickTapBtn label="10.000 UZS" onClick={() => setStartAmountInput('10000')} className="vibrant-btn-label" />
                                                <QuickTapBtn label="20.000 UZS" onClick={() => setStartAmountInput('20000')} className="vibrant-btn-label" />
                                                <QuickTapBtn label="1 SOAT" onClick={() => handleAction('start', 60)} className="neon-purple" />
                                                <QuickTapBtn label="2 SOAT" onClick={() => handleAction('start', 120)} className="neon-purple" />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsReserveMode(true)} style={{ padding: '28px', borderRadius: '35px', background: 'rgba(255,170,0,0.05)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.2)', fontWeight: '950', fontSize: '16px' }}>BRON QILISH 🗓️</motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ padding: '28px', borderRadius: '35px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '20px', boxShadow: '0 15px 50px rgba(112,0,255,0.4)' }}>START 🚀</motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key="busy-ui">
                                            {(() => {
                                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                                return (
                                                    <div className="premium-box" style={{ padding: '50px 20px', textAlign: 'center', marginBottom: '35px', position: 'relative', overflow: 'hidden' }}>
                                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '8px', fontWeight: '950', marginBottom: '15px' }}>VAQT {info.isCountdown ? 'QOLDI' : 'O\'TDI'}</p>
                                                        <h1 style={{ fontSize: '105px', margin: 0, fontWeight: '950', color: '#fff', letterSpacing: '-6px', textShadow: '0 0 30px rgba(255,255,255,0.1)' }}>{info.time}</h1>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
                                                            <div><p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '950', margin: '0 0 5px' }}>BOSHLANDI</p><b style={{ fontSize: '22px', color: '#fff' }}>{info.startTime || '--:--'}</b></div>
                                                            <div><p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '950', margin: '0 0 5px' }}>SUMMA</p><b style={{ fontSize: '28px', color: '#39ff14' }}>{info.cost?.toLocaleString()}</b></div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(selectedPC.status === 'paused' ? 'resume' : 'pause')} style={{ padding: '32px', borderRadius: '35px', background: '#ffee32', color: '#000', border: 'none', fontWeight: '950', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>{selectedPC.status === 'paused' ? <><Play size={20} /> DAVOM</> : <><Pause size={20} /> PAUZA</>}</motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('stop')} style={{ padding: '32px', borderRadius: '35px', background: 'rgba(255,68,68,0.12)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)', fontWeight: '950', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Square size={20} /> STOP</motion.button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div style={{ textAlign: 'center', marginTop: '30px', opacity: 0.2, fontSize: '11px', fontWeight: '950', letterSpacing: '2px' }}>@X_GAME123_BOT</div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(30px)', padding: '12px 10px', borderRadius: '40px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'To\'lov', <Wallet size={22} />)}
            </nav>
        </div>
    );
};

const QuickTapBtn = ({ label, onClick, className }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: '30px', padding: '32px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className={className} style={{ fontSize: '18px', fontWeight: '950' }}>{label}</span>
    </motion.button>
);
const DashItem = ({ label, icon, value }) => (<div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>{icon}<p style={{ fontSize: '8px', color: '#444', fontWeight: '950', margin: 0 }}>{label}</p></div><b style={{ fontSize: '18px', color: '#fff' }}>{value}</b></div>);
const RoomBtn = ({ icon, onClick, color }) => (<button onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', width: '42px', height: '42px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {React.cloneElement(icon, { color: color })} </button>);
const MiniStat = ({ color, count }) => (<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '7px', height: '7px', background: color, borderRadius: '50%', boxShadow: `0 0 10px ${color}` }} /><span style={{ fontSize: '11px', color: count > 0 ? color : '#222', fontWeight: '950' }}>{count}</span></div>);

export default ManagerDashboard;
