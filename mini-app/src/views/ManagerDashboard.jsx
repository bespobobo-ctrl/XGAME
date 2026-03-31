import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send, LayoutGrid, Users, History, Wallet, Search, Filter, Terminal, Plus, Minus, MessageSquare, Banknote, Info, UserPlus, Coins, Timer, Zap, AlertTriangle, BellRing } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nowTime, setNowTime] = useState(Date.now());

    // PC Control
    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [startAmountInput, setStartAmountInput] = useState('');

    // Payments
    const [topupRequests, setTopupRequests] = useState([]);

    // Users Management
    const [searchQuery, setSearchQuery] = useState('');
    const [usersList, setUsersList] = useState([]);
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
                    setSelectedPC({ ...freshPC, roomPrice: room?.pricePerHour || selectedPC.roomPrice || 15000 });
                }
            }
        } catch (err) { console.error("Sync error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, activeTab === 'users' ? 8000 : 4000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
    }, [activeTab, searchQuery]);

    const calculateSessionInfo = (pc, roomPrice = 15000) => {
        const activeSession = pc?.Sessions?.find(s => s.status === 'active' || s.status === 'paused');
        if (!activeSession) return { time: "00:00:00", cost: 0, progress: 0, remaining: "00:00:00", isCountdown: false };

        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));

        const cost = Math.floor((diffSeconds / 3600) * roomPrice);
        const progress = activeSession.expectedMinutes ? Math.min((diffSeconds / (activeSession.expectedMinutes * 60)) * 100, 100) : Math.min((diffSeconds / 3600) * 100, 100);

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
        const pcId = selectedPC.id;
        setActionLoading(true);

        let finalMinutes = expectedMinutes;
        const amount = parseInt(startAmountInput);
        if (action === 'start' && !expectedMinutes && amount > 0) {
            finalMinutes = Math.floor((amount / selectedPC.roomPrice) * 60);
        }

        try {
            const res = await callAPI(`/api/manager/pc/${pcId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, expectedMinutes: finalMinutes })
            });
            if (res.success) {
                setTimeout(fetchData, 400);
                if (action === 'stop' || action === 'start') { setSelectedPC(null); setStartAmountInput(''); }
            }
        } catch (e) { alert("Xatolik!"); }
        finally { setActionLoading(false); }
    };

    const handleAddUserBalance = async () => {
        if (!selectedUser || !addBalanceAmount) return;
        try {
            const res = await callAPI(`/api/manager/user/${selectedUser.id}/balance`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseInt(addBalanceAmount), type: 'deposit', description: 'Naqd to\'lov (Administrator)' })
            });
            if (res.success) {
                alert("Balans qo'shildi! ✅");
                setAddBalanceAmount('');
                setSelectedUser(null);
                fetchData();
            } else alert(res.error || "Xato!");
        } catch (e) { alert("Server xatosi!"); }
    };

    const renderPC = (pc, room) => {
        const status = (pc?.status || 'free').toLowerCase();
        const isActive = status === 'busy' || status === 'paused';
        const { time, progress, isCountdown } = calculateSessionInfo(pc, room?.pricePerHour || 15000);

        const getStatusTheme = () => {
            if (status === 'busy') return { color: isCountdown ? '#39ff14' : '#ff00ff', icon: <MonitorPlay size={22} />, label: time };
            if (status === 'paused') return { color: '#ffee32', icon: <Clock size={22} />, label: `PAUZA` };
            if (status === 'reserved') return { color: '#ffaa00', icon: <CalendarClock size={22} />, label: 'BRON' };
            return { color: '#fff', icon: <Monitor size={22} />, label: 'BO\'SH' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: room?.pricePerHour || 15000 })} style={{ background: '#111', border: `1.5px solid ${isActive ? color : '#1a1a1a'}`, borderRadius: '25px', padding: '18px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%`, transition: 'width 1s linear' }} />}
                <div style={{ color: color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fff' }}>{pc.name}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: isActive ? color : '#444', marginTop: '2px' }}>{label}</div>
            </motion.div>
        );
    };

    const navItem = (id, label, icon) => (
        <div onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#646464', gap: '4px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }}>
            {activeTab === id && <motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '30px', height: '2px', background: '#7000ff', boxShadow: '0 0 15px #7000ff' }} />}
            {icon}
            <span style={{ fontSize: '9px', fontWeight: '900' }}>{(label || '').toUpperCase()}</span>
        </div>
    );

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid #111', borderTop: '3px solid #7000ff', borderRadius: '50%' }} /></div>;

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id) || selectedViewRoom;

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '130px', fontFamily: '"Outfit", sans-serif' }}>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '950' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()} <span style={{ color: '#39ff14', fontSize: '10px' }}>●</span></h2>
                <button onClick={onLogout} style={{ background: '#111', border: 'none', color: '#ff4444', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' }}>CHIQISH</button>
            </header>

            {/* 🚨 ALERT CENTER (Fixed Top) */}
            <AnimatePresence>
                {(stats?.lowBalanceAlerts?.length > 0 || stats?.upcomingReservations?.some(r => r.isUrgent)) && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} style={{ padding: '10px 20px', display: 'grid', gap: '8px', zIndex: 90 }}>
                        {stats?.lowBalanceAlerts?.map((alert, i) => (
                            <div key={`bal-${i}`} style={{ background: '#ff444415', border: '1.5px solid #ff444450', padding: '12px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} style={{ background: '#ff4444', padding: '8px', borderRadius: '10px' }}><BellRing size={16} color="#fff" /></motion.div>
                                <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '11px', fontWeight: '900' }}>{alert.pc}: PULI TUGAYAPTI!</p><p style={{ margin: 0, fontSize: '9px', color: '#ff4444' }}>Mijoz: {alert.user} • {alert.balance?.toLocaleString()} so'm</p></div>
                            </div>
                        ))}
                        {stats?.upcomingReservations?.filter(r => r.isUrgent).map((res, i) => (
                            <div key={`res-${i}`} style={{ background: '#ffaa0015', border: '1.5px solid #ffaa0050', padding: '12px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity }} style={{ background: '#ffaa00', padding: '8px', borderRadius: '10px' }}><AlertTriangle size={16} color="#000" /></motion.div>
                                <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#ffaa00' }}>BRONGA 5 MIN QOLDI! ({res.pc})</p><p style={{ margin: 0, fontSize: '9px', color: '#ffaa00' }}>Vaqt: {new Date(res.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {res.user}</p></div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '20px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #7000ff, #3000cc)', padding: '40px 20px', borderRadius: '45px', textAlign: 'center', marginBottom: '25px', boxShadow: '0 20px 40px rgba(112,0,255,0.2)' }}>
                            <p style={{ margin: '0 0 5px', fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: '950', letterSpacing: '2px' }}>UMUMIY TUSHUM</p>
                            <h1 style={{ margin: 0, fontSize: '54px', fontWeight: '950', letterSpacing: '-2px' }}>{Math.round(stats?.revenue?.day || 0).toLocaleString()}</h1>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                            <div style={{ background: '#111', padding: '18px 10px', borderRadius: '25px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                                <p style={{ fontSize: '7px', color: '#444', fontWeight: 'bold' }}>NAQD (KASSA)</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '14px', color: '#39ff14', fontWeight: '950' }}>{stats?.revenue?.cashTopups?.toLocaleString()}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '18px 10px', borderRadius: '25px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                                <p style={{ fontSize: '7px', color: '#444', fontWeight: 'bold' }}>ADMIN PC</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '14px', color: '#7000ff', fontWeight: '950' }}>{stats?.revenue?.adminPcRevenue?.toLocaleString()}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '18px 10px', borderRadius: '25px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                                <p style={{ fontSize: '7px', color: '#444', fontWeight: 'bold' }}>MIJOZ PC</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '14px', color: '#fff', fontWeight: '950' }}>{stats?.revenue?.userPcRevenue?.toLocaleString()}</h3>
                            </div>
                        </div>

                        {/* 📅 UPCOMING RESERVATIONS SECTION */}
                        <div style={{ marginBottom: '35px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}><CalendarClock size={16} color="#7000ff" /><h3 style={{ fontSize: '14px', fontWeight: '950', margin: 0, letterSpacing: '1px' }}>BUGUNGI BRONLAR</h3></div>

                            {(!stats?.upcomingReservations || stats.upcomingReservations.length === 0) ? (
                                <div style={{ background: '#0a0a0a', border: '1px dashed #111', padding: '25px', borderRadius: '30px', textAlign: 'center' }}><p style={{ margin: 0, fontSize: '12px', color: '#333', fontWeight: 'bold' }}>Bugun uchun bronlar yo'q</p></div>
                            ) : (
                                stats.upcomingReservations.map((res, i) => (
                                    <div key={i} style={{ background: '#111', border: res.isUrgent ? '1.5px solid #ffaa0050' : '1px solid #1a1a1a', padding: '20px', borderRadius: '30px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><h4 style={{ margin: 0, fontSize: '16px', fontWeight: '950' }}>{res.pc} • {res.user}</h4><p style={{ margin: 0, fontSize: '11px', color: '#444', marginTop: '3px' }}>Vaqt: {new Date(res.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                        {res.isUrgent ? <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity }} style={{ background: '#ffaa00', color: '#000', padding: '8px 15px', borderRadius: '15px', fontSize: '10px', fontWeight: '950' }}>DIQQAT!</motion.div> : <ChevronRight size={18} color="#222" />}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {[
                                { l: 'JAMI PC', v: stats?.totalPCs, c: '#fff' },
                                { l: 'BAND', v: stats?.busyPCs, c: '#ff00ff' },
                                { l: 'BRON', v: stats?.reservedPCs, c: '#ffaa00' },
                                { l: 'BO\'SH', v: stats?.freePCs, c: '#39ff14' }
                            ].map((item, i) => (
                                <div key={i} style={{ background: '#0a0a0a', padding: '15px 5px', borderRadius: '22px', border: '1px solid #111', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', color: item.c, fontWeight: '950' }}>{item.v || 0}</h3>
                                    <p style={{ margin: '3px 0 0', fontSize: '8px', color: '#333', fontWeight: '900' }}>{item.l}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '25px' }}>XONALAR DAROMADI</h2>
                        {stats?.roomStats?.map(room => (
                            <motion.div key={room.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedViewRoom(rooms.find(r => r.id === room.id))} style={{ background: '#111', borderRadius: '35px', padding: '25px', border: '1px solid #1a1a1a', marginBottom: '15px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, background: '#39ff1410', padding: '10px 20px', borderRadius: '0 0 0 20px', borderLeft: '1px solid #39ff1430', borderBottom: '1px solid #39ff1430' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', fontWeight: '950' }}>JAMI: {room.totalRevenue?.toLocaleString()} UZS</span>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '950' }}>{room.name?.toUpperCase()}</h3>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Timer size={12} color="#444" /><span style={{ fontSize: '11px', color: '#666' }}>{room.totalHours} soat ishladi</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Coins size={12} color="#444" /><span style={{ fontSize: '11px', color: '#666' }}>{room.pcCount} PC</span></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                        <div style={{ background: '#050505', padding: '10px', borderRadius: '15px' }}><p style={{ fontSize: '8px', color: '#333', margin: 0 }}>ADMIN ORQALI</p><b style={{ fontSize: '12px', color: '#7000ff' }}>{room.adminRevenue?.toLocaleString()}</b></div>
                                        <div style={{ background: '#050505', padding: '10px', borderRadius: '15px' }}><p style={{ fontSize: '8px', color: '#333', margin: 0 }}>MIJOZ ORQALI</p><b style={{ fontSize: '12px', color: '#fff' }}>{room.userRevenue?.toLocaleString()}</b></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft size={20} /></button>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>{currentRoomFromState?.name?.toUpperCase()}</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {currentRoomFromState?.Computers?.map(pc => renderPC(pc, currentRoomFromState))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '20px' }}>MIJOZLAR</h2>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={20} />
                            <input placeholder="ID yoki Ism bo'yicha..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '18px 18px 18px 50px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff', fontSize: '15px' }} />
                        </div>
                        {usersList.map(u => (
                            <div key={u.id} style={{ background: '#111', borderRadius: '30px', padding: '20px', marginBottom: '12px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>#{u.id} {u.username?.toUpperCase()}</h4><p style={{ margin: 0, fontSize: '11px', color: '#39ff14', fontWeight: 'bold' }}>{u.balance?.toLocaleString()} UZS</p></div>
                                <button onClick={() => setSelectedUser(u)} style={{ background: '#7000ff', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>BALANS +</button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '25px' }}>TASDIQLAR ({topupRequests.length})</h2>
                        {topupRequests.map(req => (
                            <div key={req.id} style={{ background: '#111', borderRadius: '30px', padding: '25px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div><h4 style={{ margin: 0 }}>{req.User?.username}</h4><p style={{ margin: 0, fontSize: '9px', color: '#333' }}>{new Date(req.createdAt).toLocaleString()}</p></div>
                                    <h2 style={{ margin: 0, color: '#39ff14' }}>{req.amount?.toLocaleString()}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#1a1a1a', color: '#fff', border: 'none' }}>RAD</button>
                                    <button style={{ flex: 1.5, padding: '12px', borderRadius: '12px', background: '#39ff14', color: '#000', border: 'none', fontWeight: '950' }}>TASDIQLASH</button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedUser(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '40px 40px 0 0', borderTop: '1px solid #1a1a1a' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ margin: '0 0 5px', fontSize: '24px', fontWeight: '950' }}>BALANS QO'SHISH</h2>
                            <input type="number" placeholder="Summa..." value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value)} style={{ width: '100%', padding: '25px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#39ff14', fontSize: '32px', textAlign: 'center', fontWeight: '950', margin: '20px 0' }} />
                            <button onClick={handleAddUserBalance} style={{ width: '100%', padding: '25px', background: '#39ff14', color: '#000', borderRadius: '25px', fontWeight: '950', fontSize: '18px', border: 'none' }}>TASDIQLASH ✓</button>
                        </motion.div>
                    </motion.div>
                )}

                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => { setSelectedPC(null); setStartAmountInput(''); }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '40px 40px 0 0', borderTop: '1px solid #1a1a1a' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}><h1 style={{ margin: 0, fontSize: '34px', fontWeight: '950' }}>{selectedPC.name}</h1><button onClick={() => { setSelectedPC(null); setStartAmountInput(''); }} style={{ background: '#1a1a1a', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '15px' }}><X size={24} /></button></div>

                            {(selectedPC.status === 'busy' || selectedPC.status === 'paused') ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ background: '#000', padding: '20px', borderRadius: '20px', textAlign: 'center' }}><p style={{ fontSize: '10px', color: '#444' }}>QOLGAN VAQT</p><h3 style={{ color: '#39ff14' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).time}</h3></div>
                                    <div style={{ background: '#000', padding: '20px', borderRadius: '20px', textAlign: 'center' }}><p style={{ fontSize: '10px', color: '#444' }}>SARAF SUMMA</p><h3>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).cost?.toLocaleString()}</h3></div>
                                    <button onClick={() => handleAction('stop')} style={{ gridColumn: 'span 1', padding: '20px', borderRadius: '20px', background: '#ff444415', color: '#ff4444', border: 'none', fontWeight: '950' }}>STOP ⏹️</button>
                                    <button onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'resume')} style={{ gridColumn: 'span 1', padding: '20px', borderRadius: '20px', background: '#ffee32', color: '#000', border: 'none', fontWeight: '950' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'DAVOM'}</button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Banknote style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} size={18} />
                                            <input type="number" placeholder="Summa..." value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', padding: '22px 18px 22px 45px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#39ff14', fontSize: '18px', fontWeight: 'bold' }} />
                                        </div>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ background: '#39ff14', color: '#000', width: '70px', height: '70px', borderRadius: '25px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={30} fill="#000" /></motion.button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {[30, 60, 120, null].map(v => (
                                            <button key={v} onClick={() => handleAction('start', v)} style={{ background: v ? '#111' : '#39ff1415', color: v ? '#fff' : '#39ff14', padding: '22px 0', borderRadius: '20px', border: '1px solid #1a1a1a', fontWeight: '950' }}>{v ? `${v}m` : '∞'}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '30px', left: '20px', right: '20px', background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px 0', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} color={activeTab === 'stats' ? '#7000ff' : '#646464'} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} color={activeTab === 'rooms' ? '#7000ff' : '#646464'} />)}
                {navItem('users', 'Mijozlar', <Users size={22} color={activeTab === 'users' ? '#7000ff' : '#646464'} />)}
                {navItem('payments', 'To\'lov', <Wallet size={22} color={activeTab === 'payments' ? '#7000ff' : '#646464'} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
