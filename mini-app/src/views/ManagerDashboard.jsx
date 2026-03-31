import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight, CheckCircle2, XCircle, CreditCard, Send, Settings, Coins, TrendingUp, DollarSign, Zap } from 'lucide-react';

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

            // Sync selected PC
            if (selectedPC) {
                const allPCs = (Array.isArray(r) ? r : []).flatMap(rm => rm.Computers || []);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
                if (freshPC) {
                    const room = (Array.isArray(r) ? r : []).find(rm => rm.id === freshPC.RoomId);
                    setSelectedPC({ ...freshPC, roomPrice: room?.pricePerHour || selectedPC.roomPrice || 15000 });
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
        const cost = Math.floor((diffSeconds / 3600) * roomPrice);
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

    const handleAddUserBalance = async () => {
        if (!selectedUser || !addBalanceAmount) return;
        try {
            const res = await callAPI(`/api/manager/user/${selectedUser.id}/balance`, {
                method: 'POST', body: JSON.stringify({ amount: parseInt(addBalanceAmount) })
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
                method: editingRoom ? 'PUT' : 'POST', body: JSON.stringify(newRoomData)
            });
            if (res.success) {
                alert(editingRoom ? "Xona tahrirlandi!" : "Xona muvaffaqiyatli qo'shildi!");
                setShowAddRoomModal(false); setEditingRoom(null); fetchData();
            } else alert(res.error || "Xatolik!");
        } catch (e) { alert("Xatolik!"); }
    };

    const navItem = (id, label, icon) => (
        <div onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#444', gap: '4px', cursor: 'pointer' }}>
            {icon}
            <span style={{ fontSize: '8px', fontWeight: '900' }}>{label.toUpperCase()}</span>
        </div>
    );

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid #111', borderTop: '3px solid #7000ff', borderRadius: '50%' }} /></div>;

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id);
    const roomReservations = currentRoomFromState?.Computers?.filter(pc => pc.status === 'reserved').map(pc => ({ pc, info: calculateSessionInfo(pc).reservedInfo })).filter(r => r.info);

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '130px', fontFamily: '"Outfit", sans-serif' }}>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '950' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()}</h2>
                <button onClick={onLogout} style={{ background: '#111', color: '#ff4444', padding: '10px 18px', borderRadius: '15px', border: 'none' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        {/* 💰 MAIN REVENUE CARD */}
                        <div style={{ background: 'linear-gradient(135deg, #7000ff, #3000cc)', padding: '50px 20px', borderRadius: '45px', textAlign: 'center', marginBottom: '25px', boxShadow: '0 25px 50px rgba(112, 0, 255, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '10px', opacity: 0.7 }}>
                                <TrendingUp size={14} />
                                <span style={{ fontSize: '10px', letterSpacing: '1.5px', fontWeight: 'bold' }}>UMUMIY TUSHUM</span>
                            </div>
                            <h1 style={{ fontSize: '64px', fontWeight: '950', margin: 0, letterSpacing: '-2px' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h1>
                        </div>

                        {/* 📊 BREAKDOWN CARDS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ background: '#111', padding: '25px 20px', borderRadius: '35px', border: '1.5px solid #1a1a1a', textAlign: 'center' }}>
                                <DollarSign size={20} color="#39ff14" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '9px', color: '#444', fontWeight: 'bold', margin: '0 0 5px' }}>NAQD (KASSA)</p>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{stats?.revenue?.cashPcRevenue?.toLocaleString()}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '25px 20px', borderRadius: '35px', border: '1.5px solid #1a1a1a', textAlign: 'center' }}>
                                <Users size={20} color="#7000ff" style={{ marginBottom: '10px' }} />
                                <p style={{ fontSize: '9px', color: '#444', fontWeight: 'bold', margin: '0 0 5px' }}>MIJOZLARNI OCHISHI</p>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{stats?.revenue?.userPcRevenue?.toLocaleString()}</h3>
                            </div>
                        </div>

                        <div style={{ background: '#111', padding: '25px', borderRadius: '35px', border: '1.5px solid #1a1a1a', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: '#ffaa0020', p: '12px', borderRadius: '15px' }}><Zap size={18} color="#ffaa00" /></div>
                                <div>
                                    <p style={{ fontSize: '9px', color: '#444', fontWeight: 'bold', margin: 0 }}>ADMIN ORQALI OCHILGAN</p>
                                    <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0 }}>{stats?.revenue?.adminPcRevenue?.toLocaleString()}</h3>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '9px', color: '#444', fontWeight: 'bold', margin: 0 }}>SAOTBAY (O'RT.)</p>
                                <h3 style={{ fontSize: '18px', color: '#39ff14' }}>{Math.round(stats?.revenue?.avgHourly || 0).toLocaleString()} UZS</h3>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '14px', marginBottom: '15px', fontWeight: '950', opacity: 0.6 }}>BUGUNGI BRONLAR</h3>
                        {stats?.upcomingReservations?.map((res, i) => (
                            <div key={i} style={{ background: '#111', padding: '18px 25px', borderRadius: '30px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #161616' }}>
                                <div><h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{res.pc} • {res.user}</h4><p style={{ fontSize: '10px', color: '#444', margin: '3px 0 0' }}>Vaqt: {formatTashkentTime(res.time)}</p></div>
                                {res.isUrgent ? <BellRing color="#ff4444" size={18} /> : <CalendarClock color="#444" size={18} />}
                            </div>
                        ))}
                        {(!stats?.upcomingReservations || stats.upcomingReservations.length === 0) && <div style={{ textAlign: 'center', padding: '30px', color: '#222', fontSize: '12px' }}>Bronlar mavjud emas</div>}
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>XONALAR</h2>
                            <button onClick={() => { setEditingRoom(null); setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' }); setShowAddRoomModal(true); }} style={{ background: '#7000ff', p: '12px 20px', borderRadius: '22px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}><Plus size={16} /> QO'SHISH</button>
                        </div>
                        {rooms.map(room => (
                            <div key={room.id} style={{ background: '#111', borderRadius: '40px', padding: '25px 30px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #1a1a1a' }}>
                                <div onClick={() => setSelectedViewRoom(room)} style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0 }}>{room.name?.toUpperCase()}</h3>
                                    <p style={{ fontSize: '11px', color: '#444', marginTop: '5px' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS / SOAT</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setEditingRoom(room); setNewRoomData({ name: room.name, pricePerHour: room.pricePerHour, pcCount: room.pcCount, specs: room.Computers?.[0]?.specs || '' }); setShowAddRoomModal(true); }} style={{ background: '#222', padding: '12px', borderRadius: '20px', border: 'none', color: '#fff' }}><Pencil size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', width: '50px', height: '50px', borderRadius: '20px', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>{currentRoomFromState?.name?.toUpperCase()}</h2>
                        </div>
                        {roomReservations.length > 0 && roomReservations.map((res, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPC({ ...res.pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: '#ffaa0015', borderLeft: '4px solid #ffaa00', padding: '20px', borderRadius: '20px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <div><p style={{ fontWeight: '950', color: '#ffaa00', margin: 0, fontSize: '16px' }}>{res.pc.name} BRON!</p><p style={{ fontSize: '11px', margin: '4px 0 0', color: '#fff' }}>{res.info.time} • {res.info.user}</p></div>
                                <ChevronRight color="#ffaa00" />
                            </motion.div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                            {currentRoomFromState?.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, currentRoomFromState.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? { color: info.isCountdown ? '#39ff14' : '#ff00ff', icon: <MonitorPlay size={24} />, label: info.time } :
                                    s === 'paused' ? { color: '#ffee32', icon: <Clock size={24} />, label: 'PAUZA' } :
                                        s === 'reserved' ? { color: '#ffaa00', icon: <CalendarClock size={24} />, label: info.reservedInfo?.time || 'BRON' } :
                                            { color: '#444', icon: <Monitor size={24} />, label: 'BO\'SH' };
                                return (
                                    <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: '#0a0a0a', border: `2px solid ${s !== 'free' ? theme.color : '#1a1a1a'}`, borderRadius: '30px', padding: '20px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                        <div style={{ color: theme.color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{theme.icon}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '950' }}>{pc.name}</div>
                                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: s !== 'free' ? theme.color : '#333', marginTop: '4px' }}>{theme.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" style={{ padding: '20px' }}>
                        <div style={{ position: 'relative', marginBottom: '25px' }}>
                            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={20} />
                            <input placeholder="Mijoz ismi yoki tel raqami..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '22px 55px', background: '#111', border: '1.5px solid #1a1a1a', borderRadius: '30px', color: '#fff', fontSize: '16px' }} />
                        </div>
                        {usersList.map(u => (
                            <div key={u.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid #1a1a1a' }}>
                                <div><h4 style={{ margin: 0, fontSize: '18px', fontWeight: '950' }}>{u.username?.toUpperCase()}</h4><p style={{ fontSize: '12px', color: '#39ff14', fontWeight: '900', marginTop: '4px' }}>{u.balance?.toLocaleString()} UZS</p></div>
                                <button onClick={() => setSelectedUser(u)} style={{ background: '#7000ff', border: 'none', color: '#fff', padding: '12px 22px', borderRadius: '18px', fontWeight: 'bold' }}>BALANS +</button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '25px' }}>TO'LOVLAR</h2>
                        {topupRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#222', fontSize: '14px' }}>Hozircha yangi to'lovlar yo'q</div>
                        ) : (
                            topupRequests.map(req => (
                                <div key={req.id} style={{ background: '#111', borderRadius: '45px', padding: '30px', marginBottom: '20px', border: '1.5px solid #1a1a1a' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                                        <div style={{ background: '#7000ff20', padding: '15px', borderRadius: '20px' }}><Wallet color="#7000ff" /></div>
                                        <div><h4 style={{ margin: 0, fontSize: '20px', fontWeight: '950' }}>{req.User?.username}</h4><p style={{ margin: '4px 0 0', color: '#39ff14', fontWeight: '950', fontSize: '16px' }}>{req.amount?.toLocaleString()} UZS</p></div>
                                    </div>
                                    {req.receiptImage && <img src={`${API_URL}/${req.receiptImage}`} alt="Receipt" style={{ width: '100%', borderRadius: '30px', marginBottom: '20px', border: '1px solid #222' }} />}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <button onClick={() => handleUpdateTopUp(req.id, 'approved')} style={{ background: '#39ff14', color: '#000', padding: '20px', borderRadius: '22px', border: 'none', fontWeight: '950', fontSize: '14px' }}>TASDIQLASH</button>
                                        <button onClick={() => handleUpdateTopUp(req.id, 'rejected')} style={{ background: '#ff444420', color: '#ff4444', padding: '20px', borderRadius: '22px', border: 'none', fontWeight: 'bold' }}>RAD ETISH</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedUser(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px 60px', borderRadius: '50px 50px 0 0', borderTop: '2px solid #222' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontWeight: '950', margin: 0 }}>BALANS TO'LDIRISH 💰</h2>
                            <p style={{ color: '#444', marginTop: '5px' }}>Mijoz: {selectedUser.username}</p>
                            <input type="number" placeholder="Summani kiriting..." value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value)} style={{ width: '100%', padding: '25px', background: '#000', border: '2px solid #1a1a1a', borderRadius: '30px', color: '#39ff14', fontSize: '32px', fontWeight: '950', margin: '30px 0' }} />
                            <button onClick={handleAddUserBalance} style={{ width: '100%', padding: '25px', background: '#39ff14', color: '#000', border: 'none', borderRadius: '30px', fontWeight: '950', fontSize: '18px' }}>HISOBNI TO'LDIRISH</button>
                        </motion.div>
                    </motion.div>
                )}

                {showAddRoomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddRoomModal(false)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px 60px', borderRadius: '50px 50px 0 0', borderTop: '2px solid #222' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontWeight: '950' }}>{editingRoom ? 'TAHRIRLASH' : 'YANGI XONA'} 🏗️</h2>
                            <div style={{ display: 'grid', gap: '15px', marginTop: '25px' }}>
                                <input placeholder="Xona nomi" value={newRoomData.name} onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff' }} />
                                <input type="number" placeholder="Narxi (Soatiga)" value={newRoomData.pricePerHour} onChange={e => setNewRoomData({ ...newRoomData, pricePerHour: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff' }} />
                                {!editingRoom && <input type="number" placeholder="Kompyuterlar soni" value={newRoomData.pcCount} onChange={e => setNewRoomData({ ...newRoomData, pcCount: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff' }} />}
                                <button onClick={handleAddRoom} style={{ padding: '22px', background: '#39ff14', color: '#000', border: 'none', borderRadius: '25px', fontWeight: '950', fontSize: '16px' }}>SAQLASH 🏢</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedPC(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px 60px', borderRadius: '55px 55px 0 0', borderTop: '2px solid #222' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px', alignItems: 'center' }}>
                                <div><h1 style={{ margin: 0, fontSize: '32px', fontWeight: '950' }}>{selectedPC.name}</h1><p style={{ color: '#444', fontSize: '11px', margin: '5px 0 0' }}>{selectedPC.specs}</p></div>
                                <button onClick={() => setSelectedPC(null)} style={{ background: '#222', padding: '12px', borderRadius: '20px', border: 'none', color: '#fff' }}><X size={24} /></button>
                            </div>
                            {(() => {
                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                if (selectedPC.status === 'reserved') {
                                    return (
                                        <div style={{ background: '#ffaa0015', border: '1.5px solid #ffaa0030', padding: '30px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '35px' }}>
                                            <div style={{ background: '#ffaa00', padding: '20px', borderRadius: '25px' }}><UserIcon color="#000" size={35} /></div>
                                            <div><p style={{ color: '#ffaa00', fontSize: '11px', fontWeight: 'bold', margin: '0 0 5px' }}>BRON</p><h3 style={{ fontSize: '32px', margin: 0, fontWeight: '950' }}>{info.reservedInfo?.user}</h3><b style={{ fontSize: '20px', marginTop: '5px', display: 'block' }}>{info.reservedInfo?.time}</b></div>
                                        </div>
                                    );
                                } else if (selectedPC.status !== 'free') {
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                                            <div style={{ background: '#000', padding: '30px 10px', borderRadius: '35px', textAlign: 'center', border: '1.5px solid #111' }}><p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold' }}>QOLGAN</p><h3 style={{ color: '#39ff14', fontSize: '28px', margin: 0 }}>{info.time}</h3></div>
                                            <div style={{ background: '#000', padding: '30px 10px', borderRadius: '35px', textAlign: 'center', border: '1.5px solid #111' }}><p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold' }}>SUMMA</p><h3 style={{ fontSize: '28px', margin: 0 }}>{info.cost?.toLocaleString()}</h3></div>
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{ marginBottom: '35px' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                            <input type="number" placeholder="Summani kiriting..." value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ flex: 1, padding: '25px', background: '#000', border: '1px solid #222', borderRadius: '30px', color: '#39ff14', fontSize: '24px', fontWeight: '950' }} />
                                            <button onClick={() => handleAction('start')} style={{ background: '#39ff14', color: '#000', border: 'none', width: '80px', borderRadius: '30px' }}><Play fill="#000" size={24} /></button>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {selectedPC.status !== 'free' && <button onClick={() => handleAction('stop')} style={{ padding: '25px', borderRadius: '30px', background: '#ff444420', color: '#ff4444', border: 'none', fontWeight: '950', fontSize: '18px' }}>STOP ⏹️</button>}
                                <button onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'start')} style={{ padding: '25px', borderRadius: '30px', background: selectedPC.status === 'busy' ? '#ffee32' : '#39ff14', color: '#000', border: 'none', fontWeight: '950', fontSize: '18px', gridColumn: selectedPC.status === 'free' ? 'span 2' : 'auto' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'START 🚀'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LOWER NAVBAR */}
            <nav style={{ position: 'fixed', bottom: '30px', left: '25px', right: '25px', background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(35px)', border: '1.5px solid #222', padding: '20px 0', borderRadius: '45px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={24} />)}
                {navItem('rooms', 'Xarita', <Monitor size={24} />)}
                {navItem('users', 'Mijozlar', <Users size={24} />)}
                {navItem('payments', 'To\'lov', <Wallet size={24} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
