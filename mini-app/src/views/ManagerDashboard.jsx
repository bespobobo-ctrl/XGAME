import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight, CheckCircle2, XCircle, CreditCard, Send, Settings, Coins } from 'lucide-react';

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
                alert(editingRoom ? "Xona tahrirlandi!" : "Xona qo'shildi!");
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
                        <div style={{ background: 'linear-gradient(135deg, #7000ff, #3000cc)', padding: '40px 20px', borderRadius: '45px', textAlign: 'center', marginBottom: '25px' }}>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>UMUMIY TUSHUM</p>
                            <h1 style={{ fontSize: '54px', fontWeight: '950' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h1>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '25px' }}>
                            <div style={{ background: '#111', p: '15px', borderRadius: '25px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444' }}>KASSA</p><b>{stats?.revenue?.cashPcRevenue?.toLocaleString()}</b></div>
                            <div style={{ background: '#111', p: '15px', borderRadius: '25px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444' }}>ADMIN PC</p><b>{stats?.revenue?.adminPcRevenue?.toLocaleString()}</b></div>
                            <div style={{ background: '#111', p: '15px', borderRadius: '25px', textAlign: 'center' }}><p style={{ fontSize: '8px', color: '#444' }}>MIJOZ PC</p><b>{stats?.revenue?.userPcRevenue?.toLocaleString()}</b></div>
                        </div>
                        <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>BUGUNGI BRONLAR</h3>
                        {stats?.upcomingReservations?.map((res, i) => (
                            <div key={i} style={{ background: '#111', padding: '18px', borderRadius: '30px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h4 style={{ margin: 0 }}>{res.pc} • {res.user}</h4><p style={{ fontSize: '10px', color: '#444' }}>Vaqt: {formatTashkentTime(res.time)}</p></div>
                                {res.isUrgent && <AlertTriangle color="#ffaa00" size={16} />}
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '24px' }}>XONALAR</h2>
                            <button onClick={() => { setEditingRoom(null); setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' }); setShowAddRoomModal(true); }} style={{ background: '#7000ff', p: '12px 20px', borderRadius: '20px', border: 'none', color: '#fff' }}><Plus size={16} /> QO'SHISH</button>
                        </div>
                        {rooms.map(room => (
                            <div key={room.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div onClick={() => setSelectedViewRoom(room)} style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '20px' }}>{room.name?.toUpperCase()}</h3>
                                    <p style={{ fontSize: '11px', color: '#444' }}>{room.Computers?.length} PC • {room.pricePerHour} UZS</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setEditingRoom(room); setNewRoomData({ name: room.name, pricePerHour: room.pricePerHour, pcCount: room.pcCount, specs: room.Computers?.[0]?.specs || '' }); setShowAddRoomModal(true); }} style={{ background: '#222', p: '10px', borderRadius: '15px', border: 'none', color: '#fff' }}><Pencil size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', width: '45px', height: '45px', borderRadius: '15px', border: 'none', color: '#fff' }}><ArrowLeft /></button>
                            <h2>{currentRoomFromState?.name?.toUpperCase()}</h2>
                        </div>
                        {roomReservations.length > 0 && roomReservations.map((res, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPC({ ...res.pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: '#ffaa0020', borderLeft: '4px solid #ffaa00', padding: '15px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                <div><p style={{ fontWeight: '950', color: '#ffaa00', margin: 0 }}>{res.pc.name} BRON!</p><p style={{ fontSize: '10px', margin: 0 }}>{res.info.time} • {res.info.user}</p></div>
                                <ChevronRight color="#ffaa00" />
                            </motion.div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {currentRoomFromState?.Computers?.map(pc => {
                                const info = calculateSessionInfo(pc, currentRoomFromState.pricePerHour);
                                const s = pc.status.toLowerCase();
                                const theme = s === 'busy' ? { color: info.isCountdown ? '#39ff14' : '#ff00ff', icon: <MonitorPlay size={20} />, label: info.time } :
                                    s === 'paused' ? { color: '#ffee32', icon: <Clock size={20} />, label: 'PAUZA' } :
                                        s === 'reserved' ? { color: '#ffaa00', icon: <CalendarClock size={20} />, label: info.reservedInfo?.time || 'BRON' } :
                                            { color: '#444', icon: <Monitor size={20} />, label: 'BO\'SH' };
                                return (
                                    <motion.div key={pc.id} onClick={() => setSelectedPC({ ...pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: '#0a0a0a', border: `1.5px solid ${s !== 'free' ? theme.color : '#1a1a1a'}`, borderRadius: '22px', padding: '15px 5px', textAlign: 'center' }}>
                                        <div style={{ color: theme.color, marginBottom: '6px' }}>{theme.icon}</div>
                                        <div style={{ fontSize: '10px', fontWeight: '900' }}>{pc.name}</div>
                                        <div style={{ fontSize: '8px', color: '#444' }}>{theme.label}</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" style={{ padding: '20px' }}>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={20} />
                            <input placeholder="Mijozni qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '18px 50px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff' }} />
                        </div>
                        {usersList.map(u => (
                            <div key={u.id} style={{ background: '#111', borderRadius: '30px', padding: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h4 style={{ margin: 0 }}>{u.username?.toUpperCase()}</h4><p style={{ fontSize: '11px', color: '#39ff14' }}>{u.balance?.toLocaleString()} UZS</p></div>
                                <button onClick={() => setSelectedUser(u)} style={{ background: '#7000ff', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '15px' }}>BALANS +</button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>TO'LOVLAR</h2>
                        {topupRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>To'lov so'rovlari yo'q</div>
                        ) : (
                            topupRequests.map(req => (
                                <div key={req.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                        <div style={{ background: '#39ff1410', p: '12px', borderRadius: '15px' }}><CreditCard color="#39ff14" /></div>
                                        <div><h4 style={{ margin: 0 }}>{req.User?.username}</h4><p style={{ margin: 0, color: '#39ff14', fontWeight: '900' }}>{req.amount?.toLocaleString()} UZS</p></div>
                                    </div>
                                    {req.receiptImage && <img src={`${API_URL}/${req.receiptImage}`} alt="Check" style={{ width: '100%', borderRadius: '20px', marginBottom: '15px' }} />}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button onClick={() => handleUpdateTopUp(req.id, 'approved')} style={{ background: '#39ff14', color: '#000', p: '15px', borderRadius: '15px', border: 'none', fontWeight: '900' }}>TASDIQLASH</button>
                                        <button onClick={() => handleUpdateTopUp(req.id, 'rejected')} style={{ background: '#ff444420', color: '#ff4444', p: '15px', borderRadius: '15px', border: 'none' }}>RAD ETISH</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS (User Balance, Add Room, PC Control) */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedUser(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '35px 35px 0 0' }} onClick={e => e.stopPropagation()}>
                            <h2>BALANS TO'LDIRISH</h2>
                            <p style={{ color: '#444' }}>{selectedUser.username} uchun</p>
                            <input type="number" placeholder="Summani kiriting..." value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value)} style={{ width: '100%', padding: '20px', background: '#000', borderRadius: '20px', color: '#39ff14', fontSize: '24px', margin: '20px 0' }} />
                            <button onClick={handleAddUserBalance} style={{ width: '100%', padding: '20px', background: '#39ff14', color: '#000', borderRadius: '20px', fontWeight: '900' }}>TASDIQLASH 💰</button>
                        </motion.div>
                    </motion.div>
                )}

                {showAddRoomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddRoomModal(false)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '35px 35px 0 0' }} onClick={e => e.stopPropagation()}>
                            <h2>{editingRoom ? 'TAHRIRLASH' : 'YANGI XONA'}</h2>
                            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                                <input placeholder="Nomi" value={newRoomData.name} onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })} style={{ padding: '20px', background: '#000', borderRadius: '20px', color: '#fff' }} />
                                <input type="number" placeholder="Narxi" value={newRoomData.pricePerHour} onChange={e => setNewRoomData({ ...newRoomData, pricePerHour: e.target.value })} style={{ padding: '20px', background: '#000', borderRadius: '20px' }} />
                                {!editingRoom && <input type="number" placeholder="PC soni" value={newRoomData.pcCount} onChange={e => setNewRoomData({ ...newRoomData, pcCount: e.target.value })} style={{ padding: '20px', background: '#000', borderRadius: '20px' }} />}
                                <button onClick={handleAddRoom} style={{ padding: '20px', background: '#39ff14', color: '#000', borderRadius: '20px', fontWeight: '900' }}>SAQLASH 🏢</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedPC(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px 50px', borderRadius: '50px 50px 0 0' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h1>{selectedPC.name}</h1>
                                <button onClick={() => setSelectedPC(null)} style={{ background: '#222', p: '10px', borderRadius: '15px', border: 'none', color: '#fff' }}><X /></button>
                            </div>
                            {(() => {
                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                if (selectedPC.status === 'reserved') {
                                    return (
                                        <div style={{ background: '#ffaa0015', border: '1.5px solid #ffaa0030', padding: '25px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                            <div style={{ background: '#ffaa00', p: '15px', borderRadius: '20px' }}><UserIcon color="#000" size={30} /></div>
                                            <div><p style={{ color: '#ffaa00', fontSize: '10px' }}>BRON</p><h3 style={{ fontSize: '28px', margin: 0 }}>{info.reservedInfo?.user}</h3><b>{info.reservedInfo?.time}</b></div>
                                        </div>
                                    );
                                } else if (selectedPC.status !== 'free') {
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                            <div style={{ background: '#000', p: '25px', borderRadius: '35px', textAlign: 'center' }}><p style={{ fontSize: '10px', color: '#444' }}>QOLGAN</p><h3 style={{ color: '#39ff14' }}>{info.time}</h3></div>
                                            <div style={{ background: '#000', p: '25px', borderRadius: '35px', textAlign: 'center' }}><p style={{ fontSize: '10px', color: '#444' }}>SUMMA</p><h3>{info.cost?.toLocaleString()}</h3></div>
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                            <input type="number" placeholder="Summa..." value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ flex: 1, padding: '25px', background: '#000', borderRadius: '25px', color: '#39ff14', fontSize: '22px' }} />
                                            <button onClick={() => handleAction('start')} style={{ background: '#39ff14', color: '#000', width: '80px', borderRadius: '25px', border: 'none' }}><Play fill="#000" /></button>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {selectedPC.status !== 'free' && <button onClick={() => handleAction('stop')} style={{ p: '20px', borderRadius: '25px', background: '#ff444420', color: '#ff4444' }}>STOP ⏹️</button>}
                                <button onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'start')} style={{ p: '20px', borderRadius: '25px', background: selectedPC.status === 'busy' ? '#ffee32' : '#39ff14', color: '#000', gridColumn: selectedPC.status === 'free' ? 'span 2' : 'auto' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'START 🚀'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '30px', left: '20px', right: '20px', background: 'rgba(10,10,12,0.8)', padding: '15px 0', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'To\'lov', <Wallet size={22} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
