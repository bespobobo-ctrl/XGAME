import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight, CheckCircle2, XCircle, CreditCard, Send, Settings, Coins, TrendingUp, DollarSign, Zap, BarChart3, Lock, Unlock, Hash, Activity, TimerReset, Banknote } from 'lucide-react';

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

    // Room Management
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [newRoomData, setNewRoomData] = useState({ name: '', pricePerHour: '', pcCount: '', specs: '' });

    // Payments & Users
    const [topupRequests, setTopupRequests] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [addBalanceAmount, setAddBalanceAmount] = useState('');

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [s, r, t, u] = await Promise.all([
                callAPI(`/api/manager/stats?t=${timestamp}`),
                callAPI(`/api/manager/rooms?t=${timestamp}`),
                callAPI(`/api/manager/topups?t=${timestamp}`),
                activeTab === 'users' ? callAPI(`/api/manager/users?q=${searchQuery || ''}&t=${timestamp}`) : Promise.resolve([])
            ]);

            if (s && !s.error) setStats(s);
            if (Array.isArray(r)) setRooms(r);
            if (Array.isArray(t)) setTopupRequests(t);
            if (activeTab === 'users' && Array.isArray(u)) setUsersList(u);

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
        const dataInterval = setInterval(fetchData, 4000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
    }, [activeTab, searchQuery]);

    const formatTashkentTime = (dateStr) => {
        if (!dateStr) return '--:--';
        try {
            const date = new Date(dateStr);
            if (isNaN(date)) return '--:--';
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

        if (activeSession.status === 'reserved') {
            return { time: '--:--', cost: 0, progress: 0, remaining: '--:--', isCountdown: false, reservedInfo: { time: activeSession.reserveTime, user: activeSession.guestName || 'Mehmon' }, startTime: null };
        }

        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);

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
        setActionLoading(true);
        let finalMinutes = expectedMinutes;
        const amount = parseInt(startAmountInput);
        if (action === 'start' && !expectedMinutes && amount > 0) {
            finalMinutes = Math.floor((amount / selectedPC.roomPrice) * 60);
        }
        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST', body: JSON.stringify({ action, expectedMinutes: finalMinutes })
            });
            if (res.success) {
                setTimeout(fetchData, 400);
                if (['stop', 'start', 'pause'].includes(action)) { setSelectedPC(null); setStartAmountInput(''); }
            }
        } catch (e) { alert("Xatolik!"); }
        finally { setActionLoading(false); }
    };

    const handleUpdateTopUp = async (id, status) => {
        try {
            const res = await callAPI(`/api/manager/topups/${id}/action`, {
                method: 'POST', body: JSON.stringify({ status })
            });
            if (res.success) fetchData();
        } catch (e) { alert("Xatolik!"); }
    };

    const handleAddUserBalance = async (id, amount) => {
        try {
            const res = await callAPI(`/api/manager/user/${id}/balance`, {
                method: 'POST', body: JSON.stringify({ amount: parseInt(amount) })
            });
            if (res.success) {
                setSelectedUser(null); setAddBalanceAmount(''); fetchData();
            }
        } catch (e) { alert("Xatolik!"); }
    };

    const handleAddRoom = async () => {
        if (!newRoomData.name || !newRoomData.pricePerHour || !newRoomData.pcCount) {
            alert("Barcha maydonlarni to'ldiring!"); return;
        }
        try {
            const url = editingRoom ? `/api/manager/room/${editingRoom.id}` : '/api/manager/rooms';
            const res = await callAPI(url, {
                method: editingRoom ? 'PUT' : 'POST', body: JSON.stringify({
                    name: newRoomData.name,
                    pricePerHour: parseInt(newRoomData.pricePerHour),
                    pcCount: parseInt(newRoomData.pcCount),
                    specs: newRoomData.specs || 'Standard'
                })
            });
            if (res.success) {
                setShowAddRoomModal(false); setEditingRoom(null); fetchData();
            } else alert(res.error || "Xatolik!");
        } catch (e) { alert("Xatolik!"); }
    };

    const handleDeleteRoom = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Haqiqatan ham ushbu xonani o'chirmoqchimisiz?")) return;
        try {
            const res = await callAPI(`/api/manager/room/${id}`, { method: 'DELETE' });
            if (res.success) fetchData();
        } catch (e) { alert("Xatolik!"); }
    };

    const handleLockRoom = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await callAPI(`/api/manager/room/${id}/lock`, { method: 'POST' });
            if (res.success) fetchData();
        } catch (e) { alert("Xatolik!"); }
    };

    const navItem = (id, label, icon) => (
        <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: activeTab === id ? '#7000ff' : '#555',
                gap: '4px',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            {activeTab === id && (
                <motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />
            )}
            <div style={{ padding: '6px', borderRadius: '12px', background: activeTab === id ? 'rgba(112, 0, 255, 0.1)' : 'transparent' }}>
                {icon}
            </div>
            <span style={{ fontSize: '8px', fontWeight: '900', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: '20px', fontWeight: '950', color: '#7000ff', letterSpacing: '4px' }}
            >GAMEZONE</motion.div>
        </div>
    );

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id);
    const roomReservations = currentRoomFromState?.Computers?.filter(pc => pc.status === 'reserved').map(pc => ({ pc, info: calculateSessionInfo(pc).reservedInfo })).filter(r => r.info);

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '110px', fontFamily: '"Outfit", sans-serif', overflowX: 'hidden' }}>

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
                        {/* STATS CONTENT PRESERVED */}
                        <div style={{ background: 'linear-gradient(145deg, #0e0e0e, #050505)', padding: '40px 20px', borderRadius: '40px', textAlign: 'center', marginBottom: '15px', border: '1px solid rgba(112, 0, 255, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: '900', letterSpacing: '4px', marginBottom: '8px' }}>DAILY REVENUE</p>
                            <h2 style={{ fontSize: '56px', fontWeight: '950', margin: 0, color: '#fff' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'rgba(57, 255, 20, 0.08)', padding: '6px 12px', borderRadius: '10px', color: '#39ff14', fontSize: '9px', fontWeight: '900' }}>
                                <Activity size={10} /> ACTUAL MONITORING
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <DashItem label="NAQD KASSA" icon={<Coins size={12} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} />
                            </div>
                            <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <DashItem label="ONLINE" icon={<Zap size={12} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} />
                            </div>
                        </div>

                        <div style={{ background: '#0a0a0a', padding: '18px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <DashItem label="ADMIN PC" icon={<Monitor size={12} color="#444" />} value={stats?.revenue?.adminPcRevenue?.toLocaleString()} />
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '8px', color: '#333', fontWeight: '900', marginBottom: '2px' }}>O'RT. SOATBAY</p>
                                <b style={{ color: '#39ff14', fontSize: '15px' }}>{Math.round(stats?.revenue?.avgHourly || 0).toLocaleString()} UZS</b>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>
                        {/* ROOMS LIST CONTENT PRESERVED */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                            <h1 style={{ fontSize: '20px', fontWeight: '950', margin: 0, letterSpacing: '-0.5px' }}>XONALAR</h1>
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => { setEditingRoom(null); setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' }); setShowAddRoomModal(true); }}
                                style={{
                                    background: 'linear-gradient(45deg, #7000ff 0%, #a000ff 100%)',
                                    padding: '10px 18px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '950',
                                    fontSize: '11px',
                                    boxShadow: '0 8px 20px rgba(112, 0, 255, 0.4)'
                                }}
                            >
                                <Plus size={14} strokeWidth={3} /> QO'SHISH
                            </motion.button>
                        </div>
                        {rooms.map(room => {
                            const total = room.Computers?.length || 0;
                            const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                            const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                            const free = total - busy - reserved;
                            return (
                                <motion.div
                                    key={room.id}
                                    onClick={() => setSelectedViewRoom(room)}
                                    style={{ background: room.isLocked ? 'rgba(255,68,68,0.03)' : '#090909', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: `1px solid ${room.isLocked ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.04)'}`, cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{room.name?.toUpperCase()}</h3>
                                                {room.isLocked && <Lock size={15} color="#ff4444" />}
                                            </div>
                                            <p style={{ fontSize: '11px', color: '#444', marginTop: '2px', fontWeight: '600' }}>{total} PC • {room.pricePerHour.toLocaleString()} UZS/SOAT</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <RoomAction onClick={e => handleLockRoom(e, room.id)} color={room.isLocked ? '#39ff14' : '#ffee32'} icon={room.isLocked ? <Unlock size={15} /> : <Lock size={15} />} />
                                            <RoomAction onClick={e => { e.stopPropagation(); setEditingRoom(room); setNewRoomData({ name: room.name, pricePerHour: room.pricePerHour, pcCount: room.pcCount, specs: room.Computers?.[0]?.specs || '' }); setShowAddRoomModal(true); }} icon={<Pencil size={15} />} />
                                            <RoomAction onClick={e => handleDeleteRoom(e, room.id)} color="#ff4444" icon={<Trash2 size={15} />} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px', margin: '14px 0' }}>
                                        <div style={{ flex: busy || 1, background: '#ff00ff', height: '4px', borderRadius: '10px', opacity: busy > 0 ? 1 : 0.05 }} />
                                        <div style={{ flex: reserved || 1, background: '#ffaa00', height: '4px', borderRadius: '10px', opacity: reserved > 0 ? 1 : 0.05 }} />
                                        <div style={{ flex: free || 1, background: '#39ff14', height: '4px', borderRadius: '10px', opacity: free > 0 ? 1 : 0.05 }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <MiniStat label="BAND" count={busy} color="#ff00ff" />
                                            <MiniStat label="BRON" count={reserved} color="#ffaa00" />
                                            <MiniStat label="BO'SH" count={free} color="#39ff14" />
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '8px', color: '#333', margin: 0, fontWeight: '900' }}>TUSHUM</p>
                                            <b style={{ fontSize: '13px', color: room.isLocked ? '#ff4444' : '#39ff14' }}>{room.todayRevenue?.toLocaleString()} UZS</b>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0a0a0a', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} /></button>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>{currentRoomFromState?.name?.toUpperCase()}</h1>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '10px' }}>
                            {currentRoomFromState?.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, currentRoomFromState.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? (info.isCountdown ? '#39ff14' : '#ff00ff') : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#222';
                                return (
                                    <motion.div
                                        key={pc.id} whileTap={{ scale: 0.94 }}
                                        onClick={() => setSelectedPC({ ...pc, roomPrice: currentRoomFromState.pricePerHour })}
                                        style={{
                                            background: '#090909', border: `1px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.03)'}`,
                                            borderRadius: '24px', padding: '18px 8px', textAlign: 'center', cursor: 'pointer', opacity: currentRoomFromState.isLocked ? 0.4 : 1
                                        }}
                                    >
                                        <div style={{ fontSize: '11px', fontWeight: '950', marginBottom: '4px' }}>{pc.name}</div>
                                        <div style={{ fontSize: '8px', fontWeight: '900', color: (s !== 'free') ? theme : '#333' }}>{s === 'free' ? 'BO\'SH' : (s === 'reserved' ? info.reservedInfo?.time : info.time)}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', p: '15px', backdropFilter: 'blur(35px)' }} onClick={() => setSelectedPC(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} style={{ background: '#0b0b0b', width: '100%', maxWidth: '380px', borderRadius: '45px', padding: '25px', border: '1px solid rgba(112, 0, 255, 0.25)', boxShadow: '0 30px 100px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ background: '#7000ff', width: '4px', height: '20px', borderRadius: '2px' }} />
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '950' }}>{selectedPC.name}</h2>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '8px', color: '#444', margin: 0, fontWeight: '900' }}>REAL TIME</p>
                                        <b style={{ fontSize: '12px', color: '#fff' }}>{formatTashkentTime(new Date(nowTime))}</b>
                                    </div>
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setSelectedPC(null)} style={{ background: 'rgba(255,255,255,0.05)', p: '6px', borderRadius: '12px', border: 'none', color: '#555' }}><X size={18} /></motion.button>
                                </div>
                            </div>

                            {(() => {
                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                const s = selectedPC.status.toLowerCase();
                                const themeColor = s === 'busy' ? (info.isCountdown ? '#39ff14' : '#ff00ff') : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#222';

                                return (
                                    <div style={{ marginBottom: '25px' }}>
                                        {s !== 'free' && s !== 'reserved' && (
                                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '25px 15px', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <p style={{ fontSize: '10px', color: '#444', fontWeight: '950', letterSpacing: '3px' }}>TIME REMAINING</p>
                                                <h1 style={{ fontSize: '72px', color: themeColor, fontWeight: '950', margin: '5px 0', letterSpacing: '-2px' }}>{info.time}</h1>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                                    <div><p style={{ fontSize: '8px', color: '#333', margin: 0, fontWeight: '900' }}>BOSHLAHDY</p><b style={{ fontSize: '13px' }}>{info.startTime || '--:--'}</b></div>
                                                    <div style={{ width: '1px', background: '#1a1a1a', height: '20px', margin: '5px auto' }} />
                                                    <div><p style={{ fontSize: '8px', color: '#333', margin: 0, fontWeight: '900' }}>HISOBLAHDY</p><b style={{ fontSize: '18px', color: '#fff' }}>{info.cost?.toLocaleString()}</b></div>
                                                </div>
                                            </div>
                                        )}
                                        {s === 'reserved' && (
                                            <div style={{ background: 'rgba(255, 170, 0, 0.05)', padding: '25px', borderRadius: '35px', border: '1px solid rgba(255,170,0,0.15)', textAlign: 'center' }}>
                                                <UserIcon color="#ffaa00" size={32} style={{ marginBottom: '10px' }} />
                                                <h3 style={{ fontSize: '24px', margin: 0, fontWeight: '950' }}>{info.reservedInfo?.user}</h3>
                                                <b style={{ fontSize: '16px', color: '#ffaa00' }}>{formatTashkentTime(info.reservedInfo?.time)}</b>
                                            </div>
                                        )}
                                        {s === 'free' && (
                                            <div>
                                                <div style={{ position: 'relative', marginBottom: '12px' }}>
                                                    <Banknote style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#1a1a1a' }} size={20} />
                                                    <input type="number" placeholder="SUMMA" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', padding: '22px 20px 22px 50px', background: '#000', border: '1px solid #151515', borderRadius: '22px', color: '#39ff14', fontSize: '24px', fontWeight: '950', textAlign: 'center' }} />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '15px' }}>
                                                    {[10000, 20000, 30000, 50000].map(amt => (
                                                        <motion.button key={amt} whileTap={{ scale: 0.95 }} onClick={() => setStartAmountInput(amt.toString())} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', p: '10px 2px', color: '#555', fontSize: '9px', fontWeight: '950' }}>{amt / 1000}K</motion.button>
                                                    ))}
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('start', 60)} style={{ background: 'rgba(112,0,255,0.08)', border: '1px solid #7000ff10', borderRadius: '12px', p: '10px 2px', color: '#7000ff', fontSize: '9px', fontWeight: '950' }}>1 SOAT</motion.button>
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('start', 120)} style={{ background: 'rgba(112,0,255,0.08)', border: '1px solid #7000ff10', borderRadius: '12px', p: '10px 2px', color: '#7000ff', fontSize: '9px', fontWeight: '950' }}>2 SOAT</motion.button>
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('start', 300)} style={{ background: 'rgba(112,0,255,0.08)', border: '1px solid #7000ff10', borderRadius: '12px', p: '10px 2px', color: '#7000ff', fontSize: '9px', fontWeight: '950' }}>5 SOAT</motion.button>
                                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('start')} style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid #39ff1410', borderRadius: '12px', p: '10px 2px', color: '#39ff14', fontSize: '8px', fontWeight: '950' }}>VIP UNLIM</motion.button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {selectedPC.status !== 'free' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('stop')} style={{ padding: '18px', borderRadius: '20px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: 'none', fontWeight: '950', fontSize: '13px' }}>STOP ⏹️</motion.button>}
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'start')} style={{ padding: '18px', borderRadius: '20px', background: selectedPC.status === 'busy' ? '#ffee32' : '#7000ff', color: '#000', border: 'none', fontWeight: '950', fontSize: '14px', gridColumn: (selectedPC.status === 'free' || selectedPC.status === 'reserved') ? 'span 2' : 'auto', boxShadow: selectedPC.status === 'free' ? '0 10px 30px rgba(112, 0, 255, 0.3)' : 'none' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'VAQTNI OCHISH 🚀'}</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(30px)', padding: '12px 10px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={20} />)}
                {navItem('rooms', 'Xarita', <Monitor size={20} />)}
                {navItem('users', 'Mijozlar', <Users size={20} />)}
                {navItem('payments', 'To\'lov', <Wallet size={20} />)}
            </nav>
        </div>
    );
};

const DashItem = ({ label, icon, value }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>{icon}<p style={{ fontSize: '8px', color: '#333', fontWeight: '900', margin: 0 }}>{label}</p></div>
        <b style={{ fontSize: '16px' }}>{value}</b>
    </div>
);

const RoomAction = ({ icon, onClick, color = '#fff' }) => (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', width: '38px', height: '38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</button>
);

const MiniStat = ({ label, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '4px', height: '4px', background: color, borderRadius: '50%', boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontSize: '10px', color: count > 0 ? color : '#333', fontWeight: '950' }}>{count}</span>
    </div>
);

export default ManagerDashboard;
