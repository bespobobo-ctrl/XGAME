import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, BellRing, Activity, Banknote, Phone, Contact2, History, Pause, Square, Play, Power, DollarSign, Timer, ChevronRight, Unlock, Lock, Coins, Zap } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    // 🏦 Core Data State
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowTime, setNowTime] = useState(Date.now());

    // 🛰️ Tracking
    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [startAmountInput, setStartAmountInput] = useState('');
    const [globalAlert, setGlobalAlert] = useState(null);

    // 🗓️ Reservation State
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

            // 🔄 Auto-refresh selected PC info
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
        const dataInterval = setInterval(fetchData, 5000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);

        let socket = null;
        // 🛰️ USE GLOBAL SOCKET.IO (FROM INDEX.HTML)
        if (window.io) {
            socket = window.io(API_URL || 'https://server.respect-game.uz', { transports: ['websocket'] });
            socket.on('upcoming-alert', (data) => {
                setGlobalAlert(data);
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => { });
                setTimeout(() => setGlobalAlert(null), 15000);
            });
            socket.on('pc-status-updated', fetchData);
        }

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
        if (!pc) return { time: "00:00:00", cost: 0, startTime: null };
        const price = roomPrice || 15000;
        const sessions = pc.Sessions || [];
        const activeSession = sessions.find(s => s.status === 'active' || s.status === 'paused' || s.status === 'reserved');

        if (!activeSession) return { time: "00:00:00", cost: 0, startTime: null };

        const sTime = activeSession.startTime ? formatTashkentTime(activeSession.startTime) : null;
        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);

        if (activeSession.status === 'reserved') {
            return { time: '--:--', cost: 0, reservedInfo: { time: activeSession.reserveTime, user: activeSession.guestName || 'Mehmon' }, startTime: null };
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
        if (action === 'reserve' && (!resName || !resPhone || !resTime)) { alert("Ma'lumotларни то'лиқ кiритинг!"); return; }

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
            } else { alert(res.error || "Server xatosi!"); }
        } catch (e) { alert("Tarmoqda xatolik!"); }
        finally { setActionLoading(false); }
    };

    const navItem = (id, label, icon) => (
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#999', gap: '4px', cursor: 'pointer', position: 'relative' }}>
            {activeTab === id && (<motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />)}
            <div style={{ padding: '8px', borderRadius: '15px', background: activeTab === id ? 'rgba(112, 0, 255, 0.15)' : 'transparent' }}>{icon}</div>
            <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff', gap: '20px' }}><div className="loading-spinner" /><b style={{ letterSpacing: '4px' }}>LOADING SYSTEM</b><style>{`.loading-spinner { width: 40px; height: 40px; border: 4px solid #111; border-top: 4px solid #7000ff; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '120px', fontFamily: '"Outfit", sans-serif', overflowX: 'hidden' }}>
            <style>
                {`
                .vibrant-btn-label { color: #ffffff !important; opacity: 1 !important; text-shadow: 0 0 2px #fff; }
                .neon-purple { color: #b480ff !important; opacity: 1 !important; text-shadow: 0 0 10px rgba(180,128,255,0.4); }
                .neon-green { color: #39ff14 !important; opacity: 1 !important; text-shadow: 0 0 10px rgba(57,255,20,0.4); }
                .res-input { width: 100%; padding: 22px 15px 22px 55px; background: #0c0c0c; border: 1px solid #333; border-radius: 25px; color: #fff; font-size: 18px; margin-bottom: 15px; font-weight: 950; outline: none; box-sizing: border-box; }
                .premium-box { background: rgba(255,255,255,0.06); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.12); border-radius: 55px; box-shadow: 0 30px 80px rgba(0,0,0,0.6); }
                .secondary-label { color: #AAAAAA !important; font-weight: 950 !important; }
                `}
            </style>

            <AnimatePresence>
                {globalAlert && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '15px', right: '15px', zIndex: 5000, background: 'linear-gradient(90deg, #7000ff, #000)', padding: '24px', borderRadius: '35px', border: '1px solid #fff', boxShadow: '0 25px 60px rgba(112,0,255,0.6)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#fff', borderRadius: '50%', padding: '12px', color: '#7000ff' }}><BellRing size={28} /></div>
                        <div style={{ flex: 1 }}><b style={{ fontSize: '18px', display: 'block', color: '#fff', letterSpacing: '-0.5px' }}>BRON OGOHLANTIRISH! 🚨</b><span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}><b>{globalAlert.pcName}</b> • {globalAlert.guestName} келяпти!</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '22px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 12px #7000ff' }} />
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '950', letterSpacing: '-0.3px', color: '#fff' }}>{stats?.clubName || 'GAMEZONE'}</h1>
                </div>
                <button onClick={onLogout} style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(255,68,68,0.2)', fontSize: '11px', fontWeight: '950' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
                        <div style={{ background: 'linear-gradient(145deg, #111, #000)', padding: '45px 25px', borderRadius: '45px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(112, 0, 255, 0.15)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
                            <p className="secondary-label" style={{ fontSize: '11px', letterSpacing: '5px', marginBottom: '8px' }}>DAILY REVENUE</p>
                            <h2 style={{ fontSize: '62px', fontWeight: '950', margin: '5px 0', color: '#fff', letterSpacing: '-3px' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(57, 255, 20, 0.15)', padding: '8px 16px', borderRadius: '12px', color: '#39ff14', fontSize: '11px', fontWeight: '950' }}> <Activity size={12} /> LIVE ANALYTICS </div>
                        </div>

                        {stats?.upcomingReservations?.length > 0 && (
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '12px' }}><CalendarClock size={20} color="#ffaa00" /><h3 style={{ fontSize: '14px', fontWeight: '950', margin: 0, color: '#fff' }}>UPCOMING BRONS</h3></div>
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '15px' }}>
                                    {stats.upcomingReservations.map(res => (
                                        <div key={res.id} style={{ minWidth: '240px', background: res.isUrgent ? 'rgba(255,170,0,0.15)' : '#0d0d0d', border: `1px solid ${res.isUrgent ? '#ffaa00' : 'rgba(255,255,255,0.08)'}`, padding: '22px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><b style={{ fontSize: '14px', color: '#fff' }}>{res.user}</b><span style={{ fontSize: '11px', color: res.isUrgent ? '#ffaa00' : '#888', fontWeight: '950', letterSpacing: '1px' }}>{res.pc}</span></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="#ffaa00" /><b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{formatTashkentTime(res.time)}</b></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: '#0d0d0d', padding: '24px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }}><DashItem label="NAQD KASSA" icon={<Coins size={14} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} /></div>
                            <div style={{ background: '#0d0d0d', padding: '24px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)' }}><DashItem label="ONLINE" icon={<Zap size={14} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} /></div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}><h1 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: '#fff' }}>XONALAR</h1><motion.button onClick={() => fetchData()} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 22px', borderRadius: '18px', border: 'none', color: '#fff', fontWeight: '950', fontSize: '12px' }}>REFRESH</motion.button></div>
                        {rooms.map(room => {
                            const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                            const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                            const free = (room.Computers?.length || 0) - busy - reserved;
                            return (
                                <motion.div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: room.isLocked ? 'rgba(255,68,68,0.08)' : '#0d0d0d', borderRadius: '40px', padding: '28px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div><h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>{room.name?.toUpperCase()}</h3><p className="secondary-label" style={{ fontSize: '12px', marginTop: '4px' }}>{room.pricePerHour.toLocaleString()} UZS / SOAT</p></div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <RoomBtn icon={room.isLocked ? <Unlock size={16} /> : <Lock size={16} />} color={room.isLocked ? '#39ff14' : '#ffee32'} onClick={e => { e.stopPropagation(); callAPI(`/api/manager/room/${room.id}/lock`, { method: 'POST' }).then(fetchData); }} />
                                            <RoomBtn icon={<Trash2 size={16} />} color="#ff4444" onClick={e => { e.stopPropagation(); if (window.confirm("Room o'chirilsinmi?")) callAPI(`/api/manager/room/${room.id}`, { method: 'DELETE' }).then(fetchData); }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', margin: '20px 0' }}><div style={{ height: '6px', background: '#ff00ff', flex: busy || 0.1, borderRadius: '6px', opacity: busy > 0 ? 1 : 0.2 }} /><div style={{ height: '6px', background: '#ffaa00', flex: reserved || 0.1, borderRadius: '6px', opacity: reserved > 0 ? 1 : 0.2 }} /><div style={{ height: '6px', background: '#39ff14', flex: free || 0.1, borderRadius: '6px', opacity: free > 0 ? 1 : 0.2 }} /></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: '16px' }}><MiniStat color="#ff00ff" count={busy} label="BUSY" /><MiniStat color="#ffaa00" count={reserved} label="BRON" /><MiniStat color="#39ff14" count={free} label="FREE" /></div><b style={{ fontSize: '16px', color: '#39ff14', fontWeight: '950' }}>{room.todayRevenue?.toLocaleString()} UZS</b></div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}><button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0d0d0d', width: '50px', height: '50px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}><ArrowLeft size={24} /></button><h1 style={{ margin: 0, fontSize: '26px', fontWeight: '950', color: '#fff' }}>{selectedViewRoom.name?.toUpperCase()}</h1></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '15px' }}>
                            {selectedViewRoom.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, selectedViewRoom.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? '#ff00ff' : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#333';
                                return (
                                    <motion.div key={pc.id} whileTap={{ scale: 0.94 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: '#0d0d0d', border: `2.5px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.1)'}`, borderRadius: '28px', padding: '22px 5px', textAlign: 'center' }}><b style={{ fontSize: '14px', display: 'block', marginBottom: '6px', color: '#fff' }}>{pc.name}</b><span style={{ fontSize: '10px', color: (s !== 'free') ? theme : '#999', fontWeight: '950' }}>{s === 'free' ? 'AVAILABLE' : info.time}</span></motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* 🚀 CLUBTIMER PRO (BRIGHT METRICS) */}
                <AnimatePresence>
                    {selectedPC && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(60px)' }} onClick={() => { setSelectedPC(null); setIsReserveMode(false); }}>
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#030303', width: '100%', padding: '35px 25px 70px', borderRadius: '65px 65px 0 0', borderTop: '3px solid #7000ff', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div><h1 style={{ margin: 0, fontSize: '42px', fontWeight: '950', letterSpacing: '-2px', color: '#fff' }}>{selectedPC.name}</h1><p className="secondary-label" style={{ fontSize: '13px', letterSpacing: '2px' }}>NEXUS COMMAND</p></div>
                                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'right' }}><p className="secondary-label" style={{ fontSize: '10px', margin: 0 }}>SYSTEM TIME</p><b style={{ fontSize: '22px', color: '#fff', fontWeight: '950' }}>{formatTashkentTime(new Date(nowTime))}</b></div>
                                        <button onClick={() => { setSelectedPC(null); setIsReserveMode(false); }} style={{ background: 'rgba(255,255,255,0.1)', width: '56px', height: '56px', borderRadius: '20px', border: 'none', color: '#fff' }}><X size={30} /></button>
                                    </div>
                                </div>

                                {isReserveMode ? (
                                    <div key="reserve-form">
                                        <div style={{ position: 'relative' }}> <Contact2 style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={24} /> <input className="res-input" placeholder="Mijoz ismi" value={resName} onChange={e => setResName(e.target.value)} /> </div>
                                        <div style={{ position: 'relative' }}> <Phone style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={24} /> <input className="res-input" placeholder="Telefon raqami" value={resPhone} onChange={e => setResPhone(e.target.value)} /> </div>
                                        <div style={{ position: 'relative' }}> <Clock style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#7000ff' }} size={24} /> <input className="res-input" type="time" value={resTime} onChange={e => setResTime(e.target.value)} /> </div>
                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('reserve')} style={{ width: '100%', padding: '28px', borderRadius: '35px', background: 'linear-gradient(45deg, #ffaa00, #ff7700)', color: '#000', border: 'none', fontSize: '20px', fontWeight: '950' }}>SAVE RESERVATION 🔒</motion.button>
                                        <button onClick={() => setIsReserveMode(false)} style={{ width: '100%', color: '#888', background: 'transparent', border: 'none', marginTop: '20px', fontWeight: '950', fontSize: '14px' }}>CANCEL</button>
                                    </div>
                                ) : (
                                    <>
                                        {selectedPC.status === 'free' ? (
                                            <div key="free-ui">
                                                <div style={{ position: 'relative', marginBottom: '35px', background: '#000', borderRadius: '45px', padding: '45px 25px', border: '2px solid #111' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', opacity: 0.5 }}><Banknote size={22} color="#fff" /><span className="secondary-label" style={{ fontSize: '12px', letterSpacing: '5px' }}>ENTER SUMMA</span></div>
                                                    <input type="number" placeholder="0" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#39ff14', fontSize: '76px', fontWeight: '950', outline: 'none', letterSpacing: '-3px' }} />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '35px' }}>
                                                    <QuickTapBtn label="10.000 UZS" onClick={() => setStartAmountInput('10000')} className="vibrant-btn-label" />
                                                    <QuickTapBtn label="20.000 UZS" onClick={() => setStartAmountInput('20000')} className="vibrant-btn-label" />
                                                    <QuickTapBtn label="1 SOAT" onClick={() => handleAction('start', 60)} className="neon-purple" />
                                                    <QuickTapBtn label="2 SOAT" onClick={() => handleAction('start', 120)} className="neon-purple" />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsReserveMode(true)} style={{ padding: '30px', borderRadius: '40px', background: 'rgba(255,170,0,0.12)', color: '#ffaa00', border: '1px solid #ffaa0020', fontWeight: '950', fontSize: '18px' }}>RESERVE 🗓️</motion.button>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ padding: '30px', borderRadius: '40px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '22px' }}>START 🚀</motion.button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key="busy-ui">
                                                {(() => {
                                                    const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                                    return (
                                                        <div className="premium-box" style={{ padding: '65px 20px', textAlign: 'center', marginBottom: '45px' }}>
                                                            <p className="secondary-label" style={{ fontSize: '12px', letterSpacing: '10px', marginBottom: '15px' }}>TIME {info.isCountdown ? 'LEFT' : 'PASSED'}</p>
                                                            <h1 style={{ fontSize: '115px', margin: 0, fontWeight: '950', color: '#fff', letterSpacing: '-8px' }}>{info.time}</h1>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '50px', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
                                                                <div><p className="secondary-label" style={{ fontSize: '11px', margin: '0 0 10px' }}>STARTED AT</p><b style={{ fontSize: '26px', color: '#fff', fontWeight: '950' }}>{info.startTime || '--:--'}</b></div>
                                                                <div><p className="secondary-label" style={{ fontSize: '11px', margin: '0 0 10px' }}>CURRENT COST</p><b style={{ fontSize: '36px', color: '#39ff14', fontWeight: '950' }}>{info.cost?.toLocaleString()}</b></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(selectedPC.status === 'paused' ? 'resume' : 'pause')} style={{ padding: '35px', borderRadius: '45px', background: '#ffee32', color: '#000', border: 'none', fontWeight: '950', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>{selectedPC.status === 'paused' ? <><Play size={24} strokeWidth={3} /> RESUME</> : <><Pause size={24} strokeWidth={3} /> PAUSE</>}</motion.button>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('stop')} style={{ padding: '35px', borderRadius: '45px', background: 'rgba(255,68,68,0.15)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)', fontWeight: '950', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}><Square size={24} strokeWidth={3} fill="#ff4444" /> STOP</motion.button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(35px)', padding: '15px 12px', borderRadius: '45px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,1)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={24} strokeWidth={2.5} />)}
                {navItem('rooms', 'Xarita', <Monitor size={24} strokeWidth={2.5} />)}
                {navItem('users', 'Mijoz', <Users size={24} strokeWidth={2.5} />)}
                {navItem('payments', 'Kassa', <Wallet size={24} strokeWidth={2.5} />)}
            </nav>
        </div>
    );
};

const QuickTapBtn = ({ label, onClick, className }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '35px', padding: '35px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className={className} style={{ fontSize: '20px', fontWeight: '950' }}>{label}</span>
    </motion.button>
);
const DashItem = ({ label, icon, value }) => (<div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>{icon}<p className="secondary-label" style={{ fontSize: '10px', margin: 0, letterSpacing: '1.5px' }}>{label}</p></div><b style={{ fontSize: '24px', color: '#fff', fontWeight: '950' }}>{value}</b></div>);
const RoomBtn = ({ icon, onClick, color }) => (<button onClick={onClick} style={{ background: 'rgba(255,255,255,0.08)', width: '46px', height: '46px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {React.cloneElement(icon, { color: color, strokeWidth: 3 })} </button>);
const MiniStat = ({ color, count, label }) => (<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', background: color, borderRadius: '50%', boxShadow: `0 0 12px ${color}` }} /><div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '13px', color: count > 0 ? color : '#333', fontWeight: '950' }}>{count}</span><span style={{ fontSize: '8px', color: '#555', fontWeight: '950' }}>{label}</span></div></div>);

export default ManagerDashboard;
