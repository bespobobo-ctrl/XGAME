import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight, CheckCircle2, XCircle, CreditCard, Send, Settings, Coins, TrendingUp, DollarSign, Zap, BarChart3, Lock, Unlock, Hash, Activity, TimerReset, Banknote, Phone, Contact2 } from 'lucide-react';

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
                const allPCs = (Array.isArray(r) ? r : []).flatMap(rm => rm.Computers || []);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
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

        // 🛰️ SOCKET SETUP
        const socket = io(API_URL || 'https://server.respect-game.uz', { transports: ['websocket'] });
        socket.on('upcoming-alert', (data) => {
            setGlobalAlert(data);
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { });
            setTimeout(() => setGlobalAlert(null), 15000);
        });
        socket.on('pc-status-updated', fetchData);

        return () => { clearInterval(dataInterval); clearInterval(timerInterval); socket.disconnect(); };
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
        if (!pc) return { time: "00:00:00", cost: 0, progress: 0, remaining: "00:00:00", isCountdown: false, reservedInfo: null, startTime: null };
        const price = roomPrice || 15000;
        const sessions = pc.Sessions || [];
        const activeSession = sessions.find(s => s.status === 'active' || s.status === 'paused' || s.status === 'reserved');

        if (!activeSession) return { time: "00:00:00", cost: 0, progress: 0, remaining: "00:00:00", isCountdown: false, reservedInfo: null, startTime: null };

        const sTime = activeSession.startTime ? formatTashkentTime(activeSession.startTime) : null;
        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);

        if (activeSession.status === 'reserved') {
            return { time: '--:--', cost: 0, progress: 0, remaining: '--:--', isCountdown: false, reservedInfo: { time: activeSession.reserveTime, user: activeSession.guestName || 'Mehmon' }, startTime: null };
        }

        if (activeSession.expectedMinutes) {
            const totalSeconds = activeSession.expectedMinutes * 60;
            const remainingSec = Math.max(0, totalSeconds - diffSeconds);
            const rh = Math.floor(remainingSec / 3600).toString().padStart(2, '0');
            const rm = Math.floor((remainingSec % 3600) / 60).toString().padStart(2, '0');
            const rs = (remainingSec % 60).toString().padStart(2, '0');
            return { time: `${rh}:${rm}:${rs}`, cost, progress: 0, remaining: `${rh}:${rm}:${rs}`, isCountdown: true, startTime: sTime };
        } else {
            const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (diffSeconds % 60).toString().padStart(2, '0');
            return { time: `${h}:${m}:${s}`, cost, progress: 0, remaining: `${h}:${m}:${s}`, isCountdown: false, startTime: sTime };
        }
    };

    const handleAction = async (action, expectedMinutes = null) => {
        if (!selectedPC || actionLoading) return;

        // 🛡️ REZERVA VALIDATION
        if (action === 'reserve') {
            if (!resName || !resPhone || !resTime) { alert("Ism, Tel va Vaqtni kiriting!"); return; }
        }

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
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#555', gap: '4px', cursor: 'pointer', position: 'relative' }}>
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
                .res-input { width: 100%; padding: 18px 15px 18px 50px; background: #111; border: 1px solid #222; border-radius: 20px; color: #fff; font-size: 16px; margin-bottom: 12px; font-weight: 950; }
                `}
            </style>

            {/* 🛎️ GLOBAL NOTIFICATION TOAST */}
            <AnimatePresence>
                {globalAlert && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '15px', right: '15px', zIndex: 5000, background: 'linear-gradient(90deg, #7000ff, #000)', padding: '20px', borderRadius: '30px', border: '1px solid #fff', boxShadow: '0 20px 60px rgba(112,0,255,0.5)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#fff', borderRadius: '50%', padding: '10px', color: '#7000ff' }}><BellRing size={24} /></div>
                        <div style={{ flex: 1 }}>
                            <b style={{ fontSize: '16px', display: 'block', color: '#fff' }}>BRON OGOHLANTIRISH! 🚨</b>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}><b>PC: {globalAlert.pcName}</b> • {globalAlert.guestName} ({globalAlert.rTime}) келяпти!</span>
                        </div>
                        <button onClick={() => setGlobalAlert(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px' }}><X size={18} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '6px', height: '22px', background: '#7000ff', borderRadius: '3px', boxShadow: '0 0 12px #7000ff' }} />
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '950', letterSpacing: '-0.3px' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()}</h1>
                </div>
                <button onClick={onLogout} style={{ background: 'rgba(255, 68, 68, 0.08)', color: '#ff4444', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,68,68,0.15)', fontSize: '11px', fontWeight: '900' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
                        <div style={{ background: 'linear-gradient(145deg, #0e0e0e, #050505)', padding: '40px 20px', borderRadius: '40px', textAlign: 'center', marginBottom: '15px', border: '1px solid rgba(112, 0, 255, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: '900', letterSpacing: '4px', marginBottom: '8px' }}>DAILY REVENUE</p>
                            <h2 style={{ fontSize: '56px', fontWeight: '950', margin: 0, color: '#fff' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'rgba(57, 255, 20, 0.08)', padding: '6px 12px', borderRadius: '10px', color: '#39ff14', fontSize: '9px', fontWeight: '900' }}> <Activity size={10} /> ACTUAL MONITORING </div>
                        </div>

                        {/* 📅 UPCOMING RESERVATIONS IN STATS TAB */}
                        {stats?.upcomingReservations?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '10px' }}>
                                    <CalendarClock size={16} color="#ffaa00" /><h3 style={{ fontSize: '13px', fontWeight: '950', margin: 0 }}>YAQIN ORADAGI BRONLAR</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {stats.upcomingReservations.map(res => (
                                        <div key={res.id} style={{ minWidth: '220px', background: res.isUrgent ? 'rgba(255,170,0,0.1)' : '#0a0a0a', border: `1px solid ${res.isUrgent ? '#ffaa00' : 'rgba(255,255,255,0.05)'}`, padding: '18px', borderRadius: '25px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <b style={{ fontSize: '12px', color: '#fff' }}>{res.user}</b>
                                                <span style={{ fontSize: '10px', color: res.isUrgent ? '#ffaa00' : '#888', fontWeight: '950' }}>{res.pc}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={12} color="#ffaa00" /><b style={{ fontSize: '16px', color: '#fff' }}>{formatTashkentTime(res.time)}</b>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <DashItem label="NAQD KASSA" icon={<Coins size={12} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} />
                            </div>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <DashItem label="ONLINE" icon={<Zap size={12} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>
                        {!selectedViewRoom ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                                    <h1 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>XONALAR</h1>
                                    <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowAddRoomModal(true)} style={{ background: 'linear-gradient(45deg, #7000ff, #a000ff)', padding: '10px 18px', borderRadius: '16px', border: 'none', color: '#fff', fontWeight: '950', fontSize: '11px' }}><Plus size={14} /> QO'SHISH</motion.button>
                                </div>
                                {rooms.map(room => (
                                    <div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: '#090909', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div><h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{room.name?.toUpperCase()}</h3><p style={{ fontSize: '11px', color: '#888' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS</p></div>
                                            <ChevronRight color="#333" />
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div key="room-detail">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                    <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0a0a0a', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}><ArrowLeft size={20} /></button>
                                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>{selectedViewRoom.name?.toUpperCase()}</h1>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '12px' }}>
                                    {selectedViewRoom.Computers?.map(pc => {
                                        const info = calculateSessionInfo(pc, selectedViewRoom.pricePerHour);
                                        return (
                                            <motion.div key={pc.id} whileTap={{ scale: 0.94 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: '#090909', border: `1px solid ${pc.status !== 'free' ? '#7000ff' : 'rgba(255,255,255,0.03)'}`, borderRadius: '24px', padding: '18px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '950', marginBottom: '4px' }}>{pc.name}</div>
                                                <div style={{ fontSize: '8px', color: '#888' }}>{pc.status === 'free' ? 'BO\'SH' : info.time}</div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(45px)' }} onClick={() => { setSelectedPC(null); setIsReserveMode(false); }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#0a0a0a', width: '100%', padding: '30px 25px 60px', borderRadius: '50px 50px 0 0', borderTop: '2px solid rgba(112, 0, 255, 0.4)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div><h1 style={{ margin: 0, fontSize: '30px', fontWeight: '950' }}>{selectedPC.name}</h1><p style={{ color: '#aaa', fontSize: '11px' }}>ADMIN CONTROL</p></div>
                                <button onClick={() => { setSelectedPC(null); setIsReserveMode(false); }} style={{ background: '#1c1c1c', width: '45px', height: '45px', borderRadius: '16px', border: 'none', color: '#fff' }}><X size={22} /></button>
                            </div>

                            {isReserveMode ? (
                                <div key="reserve-form">
                                    <div style={{ position: 'relative' }}> <Contact2 className="res-icon" style={{ position: 'absolute', left: '15px', top: '20px', color: '#7000ff' }} />
                                        <input className="res-input" placeholder="Mijoz ismi" value={resName} onChange={e => setResName(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Phone className="res-icon" style={{ position: 'absolute', left: '15px', top: '20px', color: '#7000ff' }} />
                                        <input className="res-input" placeholder="Tel raqami" value={resPhone} onChange={e => setResPhone(e.target.value)} /> </div>
                                    <div style={{ position: 'relative' }}> <Clock className="res-icon" style={{ position: 'absolute', left: '15px', top: '20px', color: '#7000ff' }} />
                                        <input className="res-input" type="time" value={resTime} onChange={e => setResTime(e.target.value)} /> </div>

                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('reserve')} style={{ width: '100%', padding: '25px', borderRadius: '25px', background: '#ffaa00', color: '#000', border: 'none', fontSize: '18px', fontWeight: '950', marginTop: '10px' }}>BRONNI BAND QILISH 🔓</motion.button>
                                    <button onClick={() => setIsReserveMode(false)} style={{ width: '100%', color: '#888', background: 'transparent', border: 'none', marginTop: '15px', fontWeight: '900' }}>ORQAGA</button>
                                </div>
                            ) : (
                                <>
                                    {selectedPC.status === 'free' ? (
                                        <div key="free-ui">
                                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                                <Banknote style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={32} />
                                                <input type="number" placeholder="SUMMA" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', padding: '30px 20px 30px 70px', background: '#000', border: '1px solid #222', borderRadius: '30px', color: '#39ff14', fontSize: '36px', fontWeight: '950' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '25px' }}>
                                                <QuickTouchBtn label="10.000 UZS" onClick={() => setStartAmountInput('10000')} className="vibrant-btn-label" />
                                                <QuickTouchBtn label="20.000 UZS" onClick={() => setStartAmountInput('20000')} className="vibrant-btn-label" />
                                                <QuickTouchBtn label="1 SOAT" onClick={() => handleAction('start', 60)} className="neon-purple" />
                                                <QuickTouchBtn label="2 SOAT" onClick={() => handleAction('start', 120)} className="neon-purple" />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsReserveMode(true)} style={{ padding: '25px', borderRadius: '25px', background: 'rgba(255,170,0,0.1)', color: '#ffaa00', border: '1px solid rgba(255,170,0,0.3)', fontWeight: '950', fontSize: '16px' }}>BRON QILISH 📅</motion.button>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ padding: '25px', borderRadius: '25px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '18px' }}>START 🚀</motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key="busy-ui">
                                            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '40px', marginBottom: '25px' }}>
                                                <p style={{ fontSize: '11px', color: '#888', letterSpacing: '5px', fontWeight: '950' }}>VAQT QOLDI</p>
                                                <h1 style={{ fontSize: '80px', margin: 0, fontWeight: '950', color: '#39ff14' }}>{calculateSessionInfo(selectedPC).time}</h1>
                                            </div>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('stop')} style={{ width: '100%', padding: '28px', borderRadius: '28px', background: 'rgba(255,68,68,0.15)', color: '#ff4444', border: 'none', fontWeight: '950', fontSize: '20px' }}>STOP ⏹️</motion.button>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(30px)', padding: '12px 10px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.06)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={20} />)}
                {navItem('rooms', 'Xarita', <Monitor size={20} />)}
                {navItem('users', 'Mijjzlar', <Users size={20} />)}
                {navItem('payments', 'To\'lov', <Wallet size={20} />)}
            </nav>
        </div>
    );
};

const QuickTouchBtn = ({ label, onClick, className }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '25px', padding: '25px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className={className} style={{ fontSize: '18px', fontWeight: '950' }}>{label}</span>
    </motion.button>
);

const DashItem = ({ label, icon, value }) => (
    <div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>{icon}<p style={{ fontSize: '8px', color: '#aaa', fontWeight: '900', margin: 0 }}>{label}</p></div><b style={{ fontSize: '16px', color: '#fff' }}>{value}</b></div>
);
const RoomAction = ({ icon, onClick, color = '#fff' }) => (<button onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {React.cloneElement(icon, { color: color })} </button>);
const MiniStat = ({ label, count, color }) => (<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '4px', height: '4px', background: color, borderRadius: '50%' }} /><span style={{ fontSize: '10px', color: count > 0 ? color : '#333', fontWeight: '950' }}>{count}</span></div>);

export default ManagerDashboard;
