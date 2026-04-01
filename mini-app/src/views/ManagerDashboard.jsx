import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, BellRing, Activity, Banknote, Phone, Contact2, History, Pause, Square, Play, Power, DollarSign, Timer, ChevronRight, Unlock, Lock, Coins, Zap } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowTime, setNowTime] = useState(Date.now());

    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [startAmountInput, setStartAmountInput] = useState('');
    const [globalAlert, setGlobalAlert] = useState(null);

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
        const dataInterval = setInterval(fetchData, 5000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        let socket = null;
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

    const formatTashkentTime = (dateStr, showSeconds = false) => {
        if (!dateStr) return '--:--';
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit', minute: '2-digit', second: showSeconds ? '2-digit' : undefined, timeZone: 'Asia/Tashkent', hour12: false
            }).format(date);
        } catch (e) { return '--:--'; }
    };

    const calculateSessionInfo = (pc, roomPrice = 15000) => {
        if (!pc) return { time: ["00", "00", "00"], cost: 0, startTime: null };
        const price = roomPrice || 15000;
        const sessions = pc.Sessions || [];
        const activeSession = sessions.find(s => s.status === 'active' || s.status === 'paused' || s.status === 'reserved');
        if (!activeSession) return { time: ["00", "00", "00"], cost: 0, startTime: null };
        const sTime = activeSession.startTime ? formatTashkentTime(activeSession.startTime) : null;
        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);
        if (activeSession.status === 'reserved') return { time: ["--", "--", "--"], cost: 0, startTime: null };
        const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSeconds % 60).toString().padStart(2, '0');
        if (activeSession.expectedMinutes) {
            const totalSeconds = activeSession.expectedMinutes * 60;
            const remainingSec = Math.max(0, totalSeconds - diffSeconds);
            const rh = Math.floor(remainingSec / 3600).toString().padStart(2, '0');
            const rm = Math.floor((remainingSec % 3600) / 60).toString().padStart(2, '0');
            const rs = (remainingSec % 60).toString().padStart(2, '0');
            return { time: [rh, rm, rs], cost, isCountdown: true, startTime: sTime };
        } else {
            return { time: [h, m, s], cost, isCountdown: false, startTime: sTime };
        }
    };

    const handleAction = async (action, expectedMinutes = null) => {
        if (!selectedPC || actionLoading) return;
        if (action === 'reserve' && (!resName || !resPhone || !resTime)) { alert("Ma'lumotlarni to'ldiring!"); return; }

        // ⚡️ OPTIMISTIC UI: Update status instantly
        const tempStatus = action === 'start' ? 'busy' : action === 'reserve' ? 'reserved' : action === 'stop' ? 'free' : action === 'pause' ? 'paused' : 'active';
        setRooms(prev => prev.map(room => ({
            ...room,
            Computers: room.Computers?.map(pc => pc.id === selectedPC.id ? { ...pc, status: tempStatus } : pc)
        })));

        setActionLoading(true);
        let finalMinutes = expectedMinutes;
        const amount = parseInt(startAmountInput);
        if (action === 'start' && !expectedMinutes && amount > 0) finalMinutes = Math.floor((amount / selectedPC.roomPrice) * 60);

        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST', body: JSON.stringify({ action, expectedMinutes: finalMinutes, reserveTime: resTime, guestName: resName, guestPhone: resPhone })
            });
            if (res.success) {
                await fetchData();
                setSelectedPC(null);
                setStartAmountInput('');
                setIsReserveMode(false);
                setResName('');
                setResPhone('');
                setResTime('');
            } else {
                alert(res.error || "Server xatosi!");
                fetchData(); // Rollback to actual state
            }
        } catch (e) { alert("Tarmoqda xatolik!"); fetchData(); }
        finally { setActionLoading(false); }
    };

    const navItem = (id, label, icon) => (
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#999', gap: '4px', cursor: 'pointer', position: 'relative' }}>
            {activeTab === id && (<motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />)}
            <div style={{ padding: '8px', borderRadius: '15px', background: activeTab === id ? 'rgba(112, 0, 255, 0.15)' : 'transparent' }}>{icon}</div>
            <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff', gap: '20px' }}><div className="loading-spinner" /><b style={{ letterSpacing: '4px' }}>INITIALIZING...</b><style>{`.loading-spinner { width: 40px; height: 40px; border: 4px solid #111; border-top: 4px solid #7000ff; border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '120px', fontFamily: '"Outfit", sans-serif', overflowX: 'hidden' }}>
            <style>
                {`
                .vibrant-btn-label { color: #ffffff !important; opacity: 1 !important; text-shadow: 0 0 2px #fff; }
                .neon-purple { color: #b480ff !important; opacity: 1 !important; text-shadow: 0 0 15px rgba(180,128,255,0.6); }
                .neon-green { color: #39ff14 !important; opacity: 1 !important; text-shadow: 0 0 15px rgba(57,255,20,0.6); }
                .res-input { width: 100%; padding: 18px 15px 18px 50px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; color: #fff; font-size: 16px; margin-bottom: 15px; font-weight: 900; outline: none; box-sizing: border-box; }
                .premium-glass { background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%); backdrop-filter: blur(80px); border: 1px solid rgba(255,255,255,0.12); border-radius: 40px; box-shadow: 0 50px 100px rgba(0,0,0,0.8); position: relative; overflow: hidden; }
                .secondary-label { color: rgba(255,255,255,0.3) !important; font-weight: 950 !important; letter-spacing: 1.5px !important; font-size: 9px !important; }
                .timer-unit { background: rgba(255,255,255,0.03); padding: 4px 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); min-width: 45px; display: inline-flex; justify-content: center; align-items: center; }
                .timer-dot { color: #7000ff; font-weight: 950; font-size: 20px; animation: blink 1.5s infinite; }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.1; } }
                .live-clock-badge { background: rgba(112,0,255,0.1); border: 1px solid rgba(112,0,255,0.2); padding: 6px 12px; border-radius: 12px; font-size: 12px; color: #fff; font-weight: 950; display: flex; align-items: center; gap: 8px; }
                `}
            </style>

            <AnimatePresence>
                {globalAlert && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '15px', right: '15px', zIndex: 5000, background: 'linear-gradient(90deg, #7000ff, #000)', padding: '24px', borderRadius: '35px', border: '1px solid #fff', boxShadow: '0 25px 60px rgba(112,0,255,0.6)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#fff', borderRadius: '50%', padding: '12px', color: '#7000ff' }}><BellRing size={28} /></div>
                        <div style={{ flex: 1 }}><b style={{ fontSize: '18px', display: 'block', color: '#fff', letterSpacing: '-0.5px' }}>ESLATMA! 🚨</b><span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}><b>{globalAlert.pcName}</b> ({globalAlert.guestName}) келиши керак!</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '22px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 12px #7000ff' }} />
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '950', letterSpacing: '-0.3px', color: '#fff' }}>{stats?.clubName || 'GAMEZONE'}</h1>
                </div>
                <div className="live-clock-badge"><Clock size={14} color="#7000ff" /> {formatTashkentTime(nowTime, true)}</div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
                        <div className="premium-glass" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '15px' }}>
                            <p className="secondary-label">DAILY COMMAND REVENUE</p>
                            <h2 style={{ fontSize: '48px', fontWeight: '950', margin: '5px 0', color: '#fff', letterSpacing: '-1.5px' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()} UZS</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.04)' }}><DashItem label="NAQD KASSA" icon={<Coins size={14} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} /></div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.04)' }}><DashItem label="PORTAL" icon={<Zap size={14} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} /></div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>
                        {rooms.map(room => {
                            const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                            const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                            const free = (room.Computers?.length || 0) - busy - reserved;
                            return (
                                <motion.div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0, color: '#fff' }}>{room.name?.toUpperCase()}</h3><p className="secondary-label" style={{ marginTop: '2px' }}>{room.pricePerHour.toLocaleString()} UZS / HR</p></div>
                                        <ChevronRight size={22} color="rgba(255,255,255,0.2)" />
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', margin: '15px 0' }}><div style={{ height: '4px', background: '#ff00ff', flex: busy || 0.1, borderRadius: '4px', opacity: busy > 0 ? 1 : 0.1 }} /><div style={{ height: '4px', background: '#ffaa00', flex: reserved || 0.1, borderRadius: '4px', opacity: reserved > 0 ? 1 : 0.1 }} /><div style={{ height: '4px', background: '#39ff14', flex: free || 0.1, borderRadius: '4px', opacity: free > 0 ? 1 : 0.1 }} /></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: '12px' }}><MiniStat color="#ff00ff" count={busy} label="BUSY" /><MiniStat color="#ffaa00" count={reserved} label="BRON" /><MiniStat color="#39ff14" count={free} label="FREE" /></div><b style={{ fontSize: '16px', color: '#39ff14', fontWeight: '950' }}>{room.todayRevenue?.toLocaleString()} UZS</b></div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}><button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0a0a0a', width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}><ArrowLeft size={18} /></button><h1 style={{ margin: 0, fontSize: '24px', fontWeight: '950', color: '#fff' }}>{selectedViewRoom.name?.toUpperCase()}</h1></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '10px' }}>
                            {selectedViewRoom.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, selectedViewRoom.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? '#ff00ff' : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#333';
                                return (
                                    <motion.div key={pc.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '15px 5px', textAlign: 'center' }}><b style={{ fontSize: '13px', display: 'block', marginBottom: '4px', color: '#fff', fontWeight: '900' }}>{pc.name}</b><span style={{ fontSize: '9px', color: (s !== 'free') ? theme : '#555', fontWeight: '950' }}>{s === 'free' ? 'AVAILABLE' : info.time.join(':')}</span></motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', backdropFilter: 'blur(30px)' }} onClick={() => { setSelectedPC(null); setIsReserveMode(false); }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="premium-glass" style={{ width: '100%', maxWidth: '380px', padding: '25px 20px', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div><h1 style={{ margin: 0, fontSize: '32px', fontWeight: '950', letterSpacing: '-1px', color: '#fff' }}>{selectedPC.name}</h1><p className="secondary-label">COMMAND UNIT v0.5</p></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                    <button onClick={() => { setSelectedPC(null); setIsReserveMode(false); }} style={{ background: 'rgba(255,255,255,0.05)', width: '35px', height: '35px', borderRadius: '10px', border: 'none', color: '#fff' }}><X size={18} /></button>
                                    <div style={{ fontSize: '10px', color: '#7000ff', fontWeight: '950' }}>{formatTashkentTime(nowTime)}</div>
                                </div>
                            </div>

                            {isReserveMode ? (
                                <div key="reserve-form">
                                    <div style={{ position: 'relative' }}> <Contact2 style={{ position: 'absolute', left: '18px', top: '18px', color: '#7000ff' }} size={18} /> <input className="res-input" placeholder="Mijoz ismi" value={resName} onChange={e => setResName(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Phone style={{ position: 'absolute', left: '18px', top: '18px', color: '#7000ff' }} size={18} /> <input className="res-input" placeholder="Tel raqami" value={resPhone} onChange={e => setResPhone(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Clock style={{ position: 'absolute', left: '18px', top: '18px', color: '#7000ff' }} size={18} /> <input className="res-input" type="time" value={resTime} onChange={e => setResTime(e.target.value)} /> </div>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('reserve')} style={{ width: '100%', padding: '18px', borderRadius: '22px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '950' }}>SAVE RESERVATION 🗓️</motion.button>
                                </div>
                            ) : (
                                <>
                                    {selectedPC.status === 'free' ? (
                                        <div key="free-ui">
                                            <div style={{ textAlign: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', padding: '25px 15px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <input type="number" placeholder="0" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#39ff14', fontSize: '56px', fontWeight: '950', outline: 'none', textAlign: 'center', letterSpacing: '-2px' }} />
                                                <p className="secondary-label">TOP-UP SUMMA</p>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                                <QuickTapBtn label="10K" onClick={() => setStartAmountInput('10000')} className="vibrant-btn-label" />
                                                <QuickTapBtn label="20K" onClick={() => setStartAmountInput('20000')} className="vibrant-btn-label" />
                                                <QuickTapBtn label="1 HR" onClick={() => handleAction('start', 60)} className="neon-purple" />
                                                <QuickTapBtn label="2 HR" onClick={() => handleAction('start', 120)} className="neon-purple" />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px' }}>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsReserveMode(true)} style={{ padding: '18px', borderRadius: '22px', background: 'rgba(255,255,255,0.03)', color: '#999', border: '1px solid rgba(255,255,255,0.08)', fontWeight: '950', fontSize: '13px' }}>RESERVE 🗓️</motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ padding: '18px', borderRadius: '22px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '18px' }}>START UNIT 🚀</motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key="busy-ui">
                                            {(() => {
                                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                                return (
                                                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                                            <div className="timer-unit"><b style={{ fontSize: '38px', fontWeight: '950', color: '#fff' }}>{info.time[0]}</b></div>
                                                            <span className="timer-dot">:</span>
                                                            <div className="timer-unit"><b style={{ fontSize: '38px', fontWeight: '950', color: '#fff' }}>{info.time[1]}</b></div>
                                                            <span className="timer-dot">:</span>
                                                            <div className="timer-unit"><b style={{ fontSize: '42px', fontWeight: '950', color: '#fff' }}>{info.time[2]}</b></div>
                                                        </div>
                                                        <p className="secondary-label" style={{ marginBottom: '20px' }}>TIME {info.isCountdown ? 'REMAINING' : 'ELAPSED'}</p>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div style={{ textAlign: 'left' }}><p className="secondary-label" style={{ margin: '0 0 5px', fontSize: '9px' }}>COST</p><b style={{ fontSize: '20px', color: '#39ff14', fontWeight: '950' }}>{parseInt(info.cost).toLocaleString()} <span style={{ fontSize: '10px', color: '#555' }}>UZS</span></b></div>
                                                            <div style={{ textAlign: 'right' }}><p className="secondary-label" style={{ margin: '0 0 5px', fontSize: '9px' }}>START</p><b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{info.startTime || '--:--'}</b></div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(selectedPC.status === 'paused' ? 'resume' : 'pause')} style={{ padding: '20px', borderRadius: '22px', background: '#ffee32', color: '#000', border: 'none', fontWeight: '950', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{selectedPC.status === 'paused' ? <><Play size={18} fill="#000" /> RESUME</> : <><Pause size={18} fill="#000" /> PAUSE</>}</motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('stop')} style={{ padding: '20px', borderRadius: '22px', background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)', fontWeight: '950', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Square size={18} fill="#ff4444" /> STOP</motion.button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(12,12,12,0.96)', backdropFilter: 'blur(40px)', padding: '15px 10px', borderRadius: '45px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,1)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} strokeWidth={2.5} />)}
                {navItem('rooms', 'Map', <Monitor size={22} strokeWidth={2.5} />)}
                {navItem('users', 'Users', <Users size={22} strokeWidth={2.5} />)}
                {navItem('payments', 'Vault', <Wallet size={22} strokeWidth={2.5} />)}
            </nav>
        </div>
    );
};

const QuickTapBtn = ({ label, onClick, className }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '22px', padding: '18px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className={className} style={{ fontSize: '14px', fontWeight: '950' }}>{label}</span>
    </motion.button>
);
const DashItem = ({ label, icon, value }) => (<div><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>{icon}<p className="secondary-label" style={{ margin: 0, letterSpacing: '1px' }}>{label}</p></div><b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{value}</b></div>);
const MiniStat = ({ color, count, label }) => (<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', background: color, borderRadius: '50%', boxShadow: `0 0 8px ${color}` }} /><div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '11px', color: count > 0 ? color : '#333', fontWeight: '950' }}>{count}</span><span style={{ fontSize: '8px', color: '#555', fontWeight: '950' }}>{label}</span></div></div>);

export default ManagerDashboard;
