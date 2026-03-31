import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight, CheckCircle2, XCircle, CreditCard, Send, Settings, Coins, TrendingUp, DollarSign, Zap, BarChart3, Lock, Unlock, Hash, Activity } from 'lucide-react';

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
        if (!pc) return { time: "00:00:00", cost: 0, progress: 0, remaining: "00:00:00", isCountdown: false, reservedInfo: null };
        const price = roomPrice || 15000;
        const pcNameNormalized = (pc.name || '').trim().toUpperCase();
        const sessions = pc.Sessions || [];
        const activeSession = sessions.find(s => s.status === 'active' || s.status === 'paused' || s.status === 'reserved');

        if (!activeSession) return { time: "00:00:00", cost: 0, progress: 0, remaining: "00:00:00", isCountdown: false, reservedInfo: null };

        if (activeSession.status === 'reserved') {
            const globalRes = stats?.upcomingReservations?.find(r => (r.pc || '').trim().toUpperCase() === pcNameNormalized);
            const rTimeStr = formatTashkentTime(globalRes?.time || activeSession.reserveTime);
            const reserveUser = globalRes?.user || activeSession.User?.username || activeSession.guestName || 'Mijoz';
            return { time: rTimeStr, cost: 0, progress: 0, remaining: rTimeStr, isCountdown: false, reservedInfo: { time: rTimeStr, user: reserveUser } };
        }

        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const cost = Math.floor((diffSeconds / 3600) * price);
        const progress = activeSession.expectedMinutes ? Math.min((diffSeconds / (activeSession.expectedMinutes * 60)) * 100, 100) : 0;

        if (activeSession.expectedMinutes) {
            const totalSeconds = activeSession.expectedMinutes * 60;
            const remainingSec = Math.max(0, totalSeconds - diffSeconds);
            const rh = Math.floor(remainingSec / 3600).toString().padStart(2, '0');
            const rm = Math.floor((remainingSec % 3600) / 60).toString().padStart(2, '0');
            const rs = (remainingSec % 60).toString().padStart(2, '0');
            return { time: `${rh}:${rm}:${rs}`, cost, progress, remaining: `${rh}:${rm}:${rs}`, isCountdown: true };
        } else {
            const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (diffSeconds % 60).toString().padStart(2, '0');
            return { time: `${h}:${m}:${s}`, cost, progress, remaining: `${h}:${m}:${s}`, isCountdown: false };
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
            else alert(res.error || "Xatolik!");
        } catch (e) { alert("Xatolik!"); }
    };

    const handleAddUserBalance = async (id, amount) => {
        try {
            const res = await callAPI(`/api/manager/user/${id}/balance`, {
                method: 'POST', body: JSON.stringify({ amount: parseInt(amount) })
            });
            if (res.success) {
                alert("Balans to'ldirildi!"); setSelectedUser(null); setAddBalanceAmount(''); fetchData();
            } else alert(res.error || "Xatolik!");
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
                gap: '6px',
                cursor: 'pointer',
                position: 'relative'
            }}
        >
            {activeTab === id && (
                <motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '25px', height: '4px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />
            )}
            <div style={{ padding: '8px', borderRadius: '14px', background: activeTab === id ? 'rgba(112, 0, 255, 0.1)' : 'transparent' }}>
                {icon}
            </div>
            <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: '24px', fontWeight: '950', color: '#7000ff', letterSpacing: '3px', marginBottom: '20px' }}
            >GAMEZONE</motion.div>
            <div style={{ width: '100px', height: '2px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div animate={{ x: [-100, 100] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '50px', height: '100%', background: '#7000ff', boxShadow: '0 0 10px #7000ff' }} />
            </div>
        </div>
    );

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id);
    const roomReservations = currentRoomFromState?.Computers?.filter(pc => pc.status === 'reserved').map(pc => ({ pc, info: calculateSessionInfo(pc).reservedInfo })).filter(r => r.info);

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '140px', fontFamily: '"Outfit", sans-serif', overflowX: 'hidden' }}>

            {/* 💎 PREMIUM HEADER */}
            <header style={{ padding: '25px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '25px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 15px #7000ff' }} />
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '950', letterSpacing: '-0.5px' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()}</h1>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={onLogout} style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '10px 20px', borderRadius: '18px', border: '1px solid rgba(255,68,68,0.2)', fontSize: '12px', fontWeight: '900' }}>CHIQISH</motion.button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ padding: '20px' }}>
                        {/* MAIN REVENUE CARD */}
                        <div style={{ background: 'linear-gradient(145deg, #0f0f0f, #050505)', padding: '50px 20px', borderRadius: '50px', textAlign: 'center', marginBottom: '25px', border: '1px solid rgba(112, 0, 255, 0.15)', boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 0 30px rgba(112, 0, 255, 0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(112, 0, 255, 0.1) 0%, transparent 70%)' }} />
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '900', letterSpacing: '4px', marginBottom: '10px' }}>DAILY REVENUE</p>
                            <h2 style={{ fontSize: '68px', fontWeight: '950', margin: 0, background: 'linear-gradient(to bottom, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', mt: '15px', background: 'rgba(57, 255, 20, 0.1)', p: '8px 16px', borderRadius: '12px', color: '#39ff14', fontSize: '10px', fontWeight: '900' }}>
                                <Activity size={12} /> BARCHA TRANZAKSIYALAR
                            </div>
                        </div>

                        {/* MINI STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ background: '#0a0a0a', p: '25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <DollarSign size={16} color="#7000ff" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '9px', color: '#444', fontWeight: '900' }}>NAQD KASSA</p>
                                <b style={{ fontSize: '18px' }}>{stats?.revenue?.cashPcRevenue?.toLocaleString()}</b>
                            </div>
                            <div style={{ background: '#0a0a0a', p: '25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <Zap size={16} color="#39ff14" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '9px', color: '#444', fontWeight: '900' }}>ONLINE TARAFI</p>
                                <b style={{ fontSize: '18px' }}>{stats?.revenue?.userPcRevenue?.toLocaleString()}</b>
                            </div>
                        </div>

                        <div style={{ background: '#0a0a0a', p: '25px', borderRadius: '40px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><Monitor size={14} color="#555" /><p style={{ fontSize: '9px', color: '#444', fontWeight: '900', margin: 0 }}>ADMIN PC</p></div>
                                <b style={{ fontSize: '18px' }}>{stats?.revenue?.adminPcRevenue?.toLocaleString()}</b>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}><TrendingUp size={14} color="#39ff14" /><p style={{ fontSize: '9px', color: '#444', fontWeight: '900', margin: 0 }}>O'RT. SOATBAY</p></div>
                                <b style={{ color: '#39ff14', fontSize: '18px' }}>{Math.round(stats?.revenue?.avgHourly || 0).toLocaleString()} UZS</b>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart3 size={24} color="#7000ff" />
                                <h1 style={{ fontSize: '26px', fontWeight: '950', margin: 0 }}>XONALAR</h1>
                            </div>

                            {/* 🚀 HYPER PREMIUM ADD BUTTON */}
                            <motion.button
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => { setEditingRoom(null); setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' }); setShowAddRoomModal(true); }}
                                style={{
                                    background: 'linear-gradient(45deg, #7000ff 0%, #a000ff 100%)',
                                    padding: '12px 24px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: '950',
                                    fontSize: '13px',
                                    boxShadow: '0 10px 30px rgba(112, 0, 255, 0.5), 0 0 10px rgba(160, 0, 255, 0.3)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ background: 'rgba(255,255,255,0.25)', padding: '5px', borderRadius: '10px', display: 'flex' }}><Plus size={16} strokeWidth={3} /></div>
                                <span style={{ letterSpacing: '0.5px' }}>QO'SHISH</span>
                            </motion.button>
                        </div>

                        {rooms.map((room, idx) => {
                            const total = room.Computers?.length || 0;
                            const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                            const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                            const free = total - busy - reserved;

                            return (
                                <motion.div
                                    key={room.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setSelectedViewRoom(room)}
                                    style={{
                                        background: room.isLocked ? 'rgba(255,68,68,0.05)' : '#0a0a0a',
                                        borderRadius: '45px',
                                        padding: '30px',
                                        marginBottom: '18px',
                                        border: `1.5px solid ${room.isLocked ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.04)'}`,
                                        cursor: 'pointer',
                                        position: 'relative',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Accent line */}
                                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '3px', background: room.isLocked ? '#ff4444' : '#7000ff', borderRadius: '0 0 4px 4px', opacity: 0.5 }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <h3 style={{ fontSize: '26px', fontWeight: '950', margin: 0, letterSpacing: '-0.5px' }}>{room.name?.toUpperCase()}</h3>
                                                {room.isLocked && <Lock size={18} color="#ff4444" />}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                                <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px', color: '#666', fontWeight: '900' }}>{total} UNITS</div>
                                                <div style={{ width: '4px', height: '4px', background: '#222', borderRadius: '50%' }} />
                                                <div style={{ fontSize: '12px', color: '#7000ff', fontWeight: '900' }}>{room.pricePerHour.toLocaleString()} UZS</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={(e) => handleLockRoom(e, room.id)} style={{ background: 'rgba(255,255,255,0.03)', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', color: room.isLocked ? '#39ff14' : '#ffee32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{room.isLocked ? <Unlock size={18} /> : <Lock size={18} />}</button>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setNewRoomData({ name: room.name, pricePerHour: room.pricePerHour, pcCount: room.pcCount, specs: room.Computers?.[0]?.specs || '' }); setShowAddRoomModal(true); }} style={{ background: 'rgba(255,255,255,0.03)', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={18} /></button>
                                            <button onClick={(e) => handleDeleteRoom(e, room.id)} style={{ background: 'rgba(255, 68, 68, 0.05)', width: '42px', height: '42px', borderRadius: '14px', border: '1px solid rgba(255, 68, 68, 0.1)', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} /></button>
                                        </div>
                                    </div>

                                    {/* PRETTIER OCCUPANCY BAR */}
                                    <div style={{ display: 'flex', gap: '8px', margin: '25px 0' }}>
                                        <div style={{ flex: busy || 1, background: '#ff00ff', height: '6px', borderRadius: '10px', boxShadow: '0 0 10px rgba(255,0,255,0.3)', opacity: busy > 0 ? 1 : 0.1 }} />
                                        <div style={{ flex: reserved || 1, background: '#ffaa00', height: '6px', borderRadius: '10px', boxShadow: '0 0 10px rgba(255,170,0,0.3)', opacity: reserved > 0 ? 1 : 0.1 }} />
                                        <div style={{ flex: free || 1, background: '#39ff14', height: '6px', borderRadius: '10px', boxShadow: '0 0 10px rgba(57,255,20,0.3)', opacity: free > 0 ? 1 : 0.1 }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '25px' }}>
                                        <div style={{ textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444', fontWeight: '900', margin: '0 0 4px' }}>BAND</p><b style={{ color: busy > 0 ? '#ff00ff' : '#222', fontSize: '16px' }}>{busy}</b></div>
                                        <div style={{ textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444', fontWeight: '900', margin: '0 0 4px' }}>BRON</p><b style={{ color: reserved > 0 ? '#ffaa00' : '#222', fontSize: '16px' }}>{reserved}</b></div>
                                        <div style={{ textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444', fontWeight: '900', margin: '0 0 4px' }}>BO'SH</p><b style={{ color: free > 0 ? '#39ff14' : '#222', fontSize: '16px' }}>{free}</b></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={12} color="#444" /><div><p style={{ fontSize: '9px', color: '#444', margin: 0 }}>ISH VAQTI</p><b style={{ fontSize: '14px' }}>{room.todayHours || 0} SOAT</b></div></div>
                                        <div style={{ textAlign: 'right' }}><p style={{ fontSize: '9px', color: '#444', margin: 0 }}>TUSHUM</p><b style={{ fontSize: '14px', color: room.isLocked ? '#ff4444' : '#39ff14' }}>{room.todayRevenue?.toLocaleString()} UZS</b></div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                            <motion.button whileTap={{ x: -5 }} onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', width: '50px', height: '50px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft /></motion.button>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '950', letterSpacing: '-1px' }}>{currentRoomFromState?.name?.toUpperCase()}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }} /> <span style={{ fontSize: '10px', color: '#555', fontWeight: '900' }}>ACTIVE MONITORING</span></div>
                            </div>
                        </div>

                        {currentRoomFromState?.isLocked && (
                            <div style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '20px', borderRadius: '25px', marginBottom: '25px', textAlign: 'center', border: '1px solid rgba(255, 68, 68, 0.2)', fontWeight: '950', fontSize: '14px' }}>
                                ⚠️ BU XONA VAQTINCHA QULFLANGAN
                            </div>
                        )}

                        {roomReservations.length > 0 && roomReservations.map((res, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPC({ ...res.pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: 'rgba(255, 170, 0, 0.1)', border: '1px solid rgba(255, 170, 0, 0.2)', padding: '20px', borderRadius: '22px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: '#ffaa00', p: '10px', borderRadius: '12px' }}><CalendarClock color="#000" size={20} /></div>
                                    <div><p style={{ fontWeight: '950', color: '#ffaa00', margin: 0, fontSize: '16px' }}>{res.pc.name} BRON!</p><p style={{ fontSize: '10px', margin: '2px 0 0', color: '#555' }}>{res.info.time} • {res.info.user}</p></div>
                                </div>
                                <ChevronRight color="#ffaa00" />
                            </motion.div>
                        ))}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '15px' }}>
                            {currentRoomFromState?.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, currentRoomFromState.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? { color: info.isCountdown ? '#39ff14' : '#ff00ff', icon: <MonitorPlay size={22} />, label: info.time } :
                                    s === 'paused' ? { color: '#ffee32', icon: <Clock size={22} />, label: 'PAUZA' } :
                                        s === 'reserved' ? { color: '#ffaa00', icon: <CalendarClock size={22} />, label: info.reservedInfo?.time || 'BRON' } :
                                            { color: '#333', icon: <Monitor size={22} />, label: 'BO\'SH' };

                                return (
                                    <motion.div
                                        key={pc.id}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => setSelectedPC({ ...pc, roomPrice: currentRoomFromState.pricePerHour })}
                                        style={{
                                            background: '#0a0a0a',
                                            border: `1.5px solid ${s !== 'free' ? theme.color : 'rgba(255,255,255,0.03)'}`,
                                            borderRadius: '30px',
                                            padding: '22px 10px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            boxShadow: s !== 'free' ? `0 10px 20px ${theme.color}15` : 'none',
                                            opacity: currentRoomFromState.isLocked ? 0.4 : 1
                                        }}
                                    >
                                        <div style={{ color: theme.color, marginBottom: '10px', opacity: s === 'free' ? 0.3 : 1 }}>{theme.icon}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '950', marginBottom: '2px' }}>{pc.name}</div>
                                        <div style={{ fontSize: '8px', fontWeight: '900', color: (s !== 'free') ? theme.color : '#333' }}>{theme.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ position: 'relative', marginBottom: '25px' }}>
                            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={20} />
                            <input placeholder="MIJOZ QIDIRISH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '22px 55px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', color: '#fff', fontSize: '13px', fontWeight: '900', letterSpacing: '1px' }} />
                        </div>
                        {usersList.map(u => (
                            <motion.div key={u.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: '#0a0a0a', borderRadius: '35px', padding: '20px 25px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '950' }}>{u.username?.toUpperCase()}</h4>
                                    <p style={{ fontSize: '12px', color: '#39ff14', fontWeight: '950', marginTop: '4px' }}>{u.balance?.toLocaleString()} UZS</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedUser(u)} style={{ background: 'linear-gradient(to right, #7000ff, #a000ff)', border: 'none', color: '#fff', padding: '12px 22px', borderRadius: '18px', fontWeight: '950', fontSize: '11px', boxShadow: '0 5px 15px rgba(112,0,255,0.3)' }}>TO'LDIRISH</motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        {topupRequests.map(req => (
                            <div key={req.id} style={{ background: '#0a0a0a', borderRadius: '45px', padding: '30px', marginBottom: '20px', border: '1px solid rgba(57,255,20,0.1)' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                                    <div style={{ background: 'rgba(57, 255, 20, 0.1)', padding: '15px', borderRadius: '18px' }}><CreditCard color="#39ff14" size={28} /></div>
                                    <div>
                                        <p style={{ fontSize: '10px', color: '#444', fontWeight: '900', margin: 0 }}>TO'LOV SO'ROVI</p>
                                        <h4 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '950' }}>{req.User?.username}</h4>
                                        <b style={{ color: '#39ff14', fontSize: '18px', fontWeight: '950' }}>{req.amount?.toLocaleString()} UZS</b>
                                    </div>
                                </div>
                                {req.receiptImage && <img src={`${API_URL}/${req.receiptImage}`} alt="Check" style={{ width: '100%', borderRadius: '30px', marginBottom: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateTopUp(req.id, 'approve')} style={{ background: '#39ff14', color: '#000', padding: '20px', borderRadius: '22px', border: 'none', fontWeight: '950', fontSize: '14px' }}>TASDIQLASH</motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpdateTopUp(req.id, 'reject')} style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', padding: '20px', borderRadius: '22px', border: 'none', fontSize: '14px', fontWeight: '900' }}>RAD ETISH</motion.button>
                                </div>
                            </div>
                        ))}
                        {topupRequests.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '100px 40px', color: '#222', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '60px', height: '60px', background: '#0a0a0a', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BellRing color="#111" size={30} /></div>
                                <p style={{ fontWeight: '900', fontSize: '11px', letterSpacing: '1px' }}>YANGI SO'ROVLAR MAVJUD EMAS</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🛸 FLOATING BOTTOM NAVIGATION */}
            <nav style={{ position: 'fixed', bottom: '25px', left: '15px', right: '15px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(35px)', padding: '15px 10px', borderRadius: '40px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'To\'lov', <Wallet size={22} />)}
            </nav>

            {/* 💎 MODALS */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedUser(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#0a0a0a', width: '90%', padding: '40px 30px', borderRadius: '50px', border: '1px solid rgba(112, 0, 255, 0.2)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ background: 'rgba(112,0,255,0.1)', w: '60px', h: '60px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}><Wallet color="#7000ff" size={32} /></div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>BALANS TO'LDIRISH</h2>
                                <p style={{ color: '#444', fontSize: '12px', marginTop: '8px' }}>{selectedUser.username?.toUpperCase()} uchun</p>
                            </div>
                            <input type="number" placeholder="SUMMANI KIRITING..." value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value)} style={{ width: '100%', padding: '25px', background: '#000', borderRadius: '25px', color: '#39ff14', fontSize: '28px', textAlign: 'center', fontWeight: '950', border: '1px solid #111', marginBottom: '25px' }} />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAddUserBalance(selectedUser.id, addBalanceAmount)} style={{ width: '100%', padding: '22px', background: '#39ff14', color: '#000', borderRadius: '25px', fontWeight: '950', fontSize: '16px', boxShadow: '0 10px 30px rgba(57,255,20,0.3)' }}>TASDIQLASH 💰</motion.button>
                        </motion.div>
                    </motion.div>
                )}

                {showAddRoomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddRoomModal(false)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#0a0a0a', width: '100%', padding: '40px 25px 60px', borderRadius: '50px 50px 0 0', borderTop: '1px solid rgba(112, 0, 255, 0.2)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '950' }}>{editingRoom ? 'TAHRIRLASH' : 'YANGI XONA'}</h2>
                                <button onClick={() => setShowAddRoomModal(false)} style={{ background: '#111', p: '10px', borderRadius: '15px', border: 'none', color: '#fff' }}><X size={24} /></button>
                            </div>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div><p style={{ fontSize: '10px', color: '#444', fontWeight: '900', marginBottom: '8px' }}>XONA NOMI</p><input value={newRoomData.name} onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })} style={{ width: '100%', padding: '22px', background: '#000', borderRadius: '22px', color: '#fff', border: '1px solid #111' }} /></div>
                                <div><p style={{ fontSize: '10px', color: '#444', fontWeight: '900', marginBottom: '8px' }}>NARXI (UZS/SOAT)</p><input type="number" value={newRoomData.pricePerHour} onChange={e => setNewRoomData({ ...newRoomData, pricePerHour: e.target.value })} style={{ width: '100%', padding: '22px', background: '#000', borderRadius: '22px', color: '#fff', border: '1px solid #111' }} /></div>
                                <div><p style={{ fontSize: '10px', color: '#444', fontWeight: '900', marginBottom: '8px' }}>KOMPYUTERLAR SONI</p><input type="number" value={newRoomData.pcCount} onChange={e => setNewRoomData({ ...newRoomData, pcCount: e.target.value })} style={{ width: '100%', padding: '22px', background: '#000', borderRadius: '22px', color: '#fff', border: '1px solid #111' }} /></div>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddRoom} style={{ padding: '25px', background: '#7000ff', color: '#fff', borderRadius: '25px', fontWeight: '950', fontSize: '16px', boxShadow: '0 15px 40px rgba(112,0,255,0.4)', marginTop: '10px' }}>SAQLASH 🏢</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedPC(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#0a0a0a', width: '100%', padding: '45px 25px 65px', borderRadius: '55px 55px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', p: '14px', borderRadius: '20px' }}><Hash color="#7000ff" size={24} /></div>
                                    <div><h1 style={{ margin: 0, fontSize: '36px', fontWeight: '950', letterSpacing: '-1px' }}>{selectedPC.name}</h1><p style={{ color: '#444', fontSize: '11px', fontWeight: '900', marginTop: '4px' }}>{selectedPC.specs?.toUpperCase()}</p></div>
                                </div>
                                <motion.button whileTap={{ scale: 0.92 }} onClick={() => setSelectedPC(null)} style={{ background: '#111', p: '14px', borderRadius: '22px', border: '1px solid #222', color: '#fff' }}><X size={26} /></motion.button>
                            </div>

                            {(() => {
                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                const s = selectedPC.status.toLowerCase();
                                const themeColor = s === 'busy' ? (info.isCountdown ? '#39ff14' : '#ff00ff') : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#222';

                                return (
                                    <div style={{ marginBottom: '45px' }}>
                                        {s !== 'free' && s !== 'reserved' && (
                                            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                                                <p style={{ fontSize: '12px', color: '#444', fontWeight: '950', letterSpacing: '4px' }}>REMAINING TIME</p>
                                                <h1 style={{ fontSize: '88px', color: themeColor, fontWeight: '950', margin: '15px 0', textShadow: `0 0 50px ${themeColor}50`, letterSpacing: '-3px' }}>{info.time}</h1>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '18px 30px', borderRadius: '25px', display: 'inline-flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <span style={{ color: '#555', fontSize: '12px', fontWeight: '900' }}>LIVE COST:</span>
                                                    <b style={{ fontSize: '22px', color: '#fff' }}>{info.cost?.toLocaleString()} UZS</b>
                                                </div>
                                            </div>
                                        )}
                                        {s === 'reserved' && (
                                            <div style={{ background: 'rgba(255, 170, 0, 0.05)', border: '1.5px solid rgba(255, 170, 0, 0.2)', padding: '35px', borderRadius: '45px', display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '35px' }}>
                                                <div style={{ background: '#ffaa00', p: '24px', borderRadius: '25px', boxShadow: '0 0 30px rgba(255,170,0,0.3)' }}><UserIcon color="#000" size={40} /></div>
                                                <div><p style={{ color: '#ffaa00', fontSize: '11px', fontWeight: '950', margin: '0 0 5px', letterSpacing: '1px' }}>RESERVATION</p><h3 style={{ fontSize: '36px', margin: 0, fontWeight: '950', letterSpacing: '-1px' }}>{info.reservedInfo?.user}</h3><b style={{ fontSize: '24px', color: '#fff' }}>{info.reservedInfo?.time}</b></div>
                                            </div>
                                        )}
                                        {s === 'free' && (
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                <div style={{ flex: 1, position: 'relative' }}>
                                                    <input type="number" placeholder="SUMMA" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', padding: '30px', background: '#000', border: '1px solid #111', borderRadius: '35px', color: '#39ff14', fontSize: '32px', fontWeight: '950', textAlign: 'center' }} />
                                                    <p style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#333', fontWeight: '900' }}>NARXGA QARAB VAQTNI HISОBLAYDI</p>
                                                </div>
                                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ background: '#39ff14', color: '#000', border: 'none', width: '100px', borderRadius: '35px', boxShadow: '0 10px 30px rgba(57,255,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play fill="#000" size={30} /></motion.button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {selectedPC.status !== 'free' && <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction('stop')} style={{ padding: '28px', borderRadius: '30px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)', fontWeight: '950', fontSize: '18px', letterSpacing: '1px' }}>STOP ⏹️</motion.button>}
                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'start')} style={{ padding: '28px', borderRadius: '30px', background: selectedPC.status === 'busy' ? '#ffee32' : '#7000ff', color: '#000', border: 'none', fontWeight: '950', fontSize: '18px', letterSpacing: '1px', gridColumn: selectedPC.status === 'free' ? 'span 2' : 'auto' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'VAQTNI OCHISH 🚀'}</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ManagerDashboard;
