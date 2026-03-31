import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send, LayoutGrid, Users, History, Wallet, Search, Filter, Terminal, Plus, Minus, MessageSquare } from 'lucide-react';

const ManagerDashboard = ({ user, activeTab, setActiveTab, onLogout }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const [selectedPC, setSelectedPC] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [nowTime, setNowTime] = useState(Date.now());

    // Reservation modal
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveNameInput, setReserveNameInput] = useState('');
    const [customMinutes, setCustomMinutes] = useState('');
    const [showReservePicker, setShowReservePicker] = useState(false);

    // Payments
    const [topupRequests, setTopupRequests] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [clubSettings, setClubSettings] = useState({ cardNumber: '', cardOwner: '' });

    // Users Management (New)
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

            const freshRooms = Array.isArray(r) ? r : [];
            setStats(s && !s.error ? s : null);
            setRooms(freshRooms);
            setTopupRequests(Array.isArray(t) ? t : []);
            if (activeTab === 'users' && Array.isArray(u)) setUsersList(u);
            if (s?.cardNumber) setClubSettings({ cardNumber: s.cardNumber, cardOwner: s.cardName || s.cardOwner || '' });

            if (selectedPC) {
                const allPCs = freshRooms.flatMap(rm => rm.Computers || []);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
                if (freshPC) {
                    const room = freshRooms.find(rm => rm.id === freshPC.RoomId);
                    setSelectedPC({ ...freshPC, roomPrice: room?.pricePerHour || selectedPC.roomPrice || 15000 });
                }
            }
        } catch (err) { console.error("Sync failed:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, activeTab === 'users' ? 10000 : 3000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
    }, [activeTab, searchQuery]);

    const calculateSessionInfo = (pc, roomPrice = 15000) => {
        const activeSession = pc.Sessions?.find(s => s.status === 'active' || s.status === 'paused');
        if (!activeSession) return { time: "00:00:00", cost: 0, progress: 0 };
        const start = new Date(activeSession.startTime);
        const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt) : nowTime;
        const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
        const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (diffSeconds % 60).toString().padStart(2, '0');
        const cost = Math.floor((diffSeconds / 3600) * roomPrice);
        const progress = activeSession.expectedMinutes ? (diffSeconds / (activeSession.expectedMinutes * 60)) * 100 : Math.min((diffSeconds / 3600) * 100, 100);
        return { time: `${h}:${m}:${s}`, cost, progress };
    };

    const handleAction = async (action, expectedMinutes = null, reserveTime = null, guestName = null) => {
        if (!selectedPC || actionLoading) return;
        const pcId = selectedPC.id;
        const currentLowerStatus = (selectedPC.status || '').toLowerCase();
        let newStatus = currentLowerStatus;
        if (action === 'start' || action === 'resume') newStatus = 'busy';
        if (action === 'stop' || action === 'cancel_reserve') newStatus = 'free';
        if (action === 'pause') newStatus = 'paused';
        if (action === 'reserve') newStatus = 'reserved';

        setRooms(prev => prev.map(room => ({ ...room, Computers: room.Computers.map(c => c.id === pcId ? { ...c, status: newStatus } : c) })));
        setSelectedPC(prev => prev ? { ...prev, status: newStatus } : null);

        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/pc/${pcId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, expectedMinutes, reserveTime, guestName })
            });
            if (res.success) {
                setTimeout(async () => {
                    await fetchData();
                    if (action === 'stop' || action === 'cancel_reserve') setSelectedPC(null);
                }, 500);
                setShowReservePicker(false);
            } else fetchData();
        } catch (e) { fetchData(); }
        setActionLoading(false);
    };

    const handleAddUserBalance = async () => {
        if (!selectedUser || !addBalanceAmount) return;
        try {
            const res = await callAPI(`/api/manager/user/${selectedUser.id}/balance`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseInt(addBalanceAmount), type: 'deposit', description: 'Naqd to\'lov (Admin)' })
            });
            if (res.success) {
                alert("Balans qo'shildi! ✅");
                setAddBalanceAmount('');
                setSelectedUser(null);
                fetchData();
            } else alert(res.error);
        } catch (e) { alert(e.message); }
    };

    const renderPC = (pc, room) => {
        const status = (pc.status || '').toLowerCase();
        const isActive = status === 'busy' || status === 'paused';
        const { time, progress } = calculateSessionInfo(pc, room.pricePerHour);
        const reservation = pc.Sessions?.find(s => s.status === 'paused' && s.reserveTime);

        const getStatusTheme = () => {
            if (status === 'busy') return { color: '#ff00ff', icon: <MonitorPlay size={24} />, label: time };
            if (status === 'paused') return { color: '#ffee32', icon: <Clock size={24} />, label: `PAUZA` };
            if (status === 'reserved' || (reservation && status !== 'busy')) return { color: '#ffaa00', icon: <CalendarClock size={24} />, label: 'BRON' };
            if (status === 'free' || status === 'available' || !status) return { color: '#39ff14', icon: <Monitor size={24} />, label: 'BO\'SH' };
            return { color: '#444', icon: <PowerOff size={24} />, label: 'O\'CHIQ' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: room.pricePerHour })} style={{ background: '#111', border: `1.5px solid ${isActive ? color : '#1a1a1a'}`, borderRadius: '25px', padding: '18px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%` }} />}
                <div style={{ color: color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fff' }}>{pc.name}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: isActive ? color : '#444', marginTop: '2px' }}>{label}</div>
            </motion.div>
        );
    };

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff' }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid #111', borderTop: '3px solid #7000ff', borderRadius: '50%' }} /></div>;

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id) || selectedViewRoom;

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '120px', fontFamily: '"Outfit", sans-serif' }}>

            <header style={{ padding: '25px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '950', letterSpacing: '1px' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()} <span style={{ color: '#39ff14', fontSize: '9px', verticalAlign: 'middle', marginLeft: '5px' }}>●</span></h2>
                <button onClick={onLogout} style={{ background: '#111', border: '1px solid #222', color: '#ff4444', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '20px' }}>
                        {(() => {
                            let liveTotalDay = stats?.revenue?.day || 0;
                            rooms.flatMap(r => r.Computers || []).forEach(pc => {
                                const activeSession = pc.Sessions?.find(s => s.status === 'active');
                                if (activeSession) {
                                    const start = new Date(activeSession.startTime);
                                    const pph = rooms.find(r => r.id === pc.RoomId)?.pricePerHour || 15000;
                                    liveTotalDay += (Math.max(0, nowTime - start.getTime()) / 3600000) * pph;
                                }
                            });
                            return (
                                <div style={{ background: 'linear-gradient(135deg, #111, #050505)', padding: '45px 20px', borderRadius: '45px', border: '1px solid #1a1a1a', textAlign: 'center', marginBottom: '25px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-10px', right: '40px', background: '#39ff1410', color: '#39ff14', fontSize: '10px', fontWeight: '900', padding: '5px 12px', borderRadius: '10px', border: '1px solid #39ff1422' }}>LIVE REVENUE</div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: '900', letterSpacing: '2px', opacity: 0.6 }}>BUGUNGI DAROMAD</p>
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: '64px', fontWeight: '950', letterSpacing: '-3px', fontFamily: 'monospace' }}>{Math.round(liveTotalDay).toLocaleString()}</h1>
                                </div>
                            );
                        })()}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
                            {[
                                { l: 'PC JAMI', v: stats?.totalPCs, c: '#fff' },
                                { l: 'BAND PC', v: stats?.busyPCs, c: '#ff00ff' },
                                { l: 'BRON', v: stats?.reservedPCs || 0, c: '#ffaa00' },
                                { l: 'BO\'SH', v: stats?.freePCs, c: '#39ff14' }
                            ].map((item, i) => (
                                <div key={i} style={{ background: '#0a0a0a', padding: '15px 5px', borderRadius: '22px', border: '1px solid #111', textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '20px', color: item.c, fontWeight: '950' }}>{item.v}</h3>
                                    <p style={{ margin: '3px 0 0', fontSize: '8px', color: '#333', fontWeight: '900' }}>{item.l}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {['day', 'week', 'month', 'year'].map(period => (
                                <div key={period} style={{ background: '#111', border: '1px solid #1a1a1a', padding: '20px 25px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div><h5 style={{ margin: 0, fontSize: '10px', color: '#333', fontWeight: '900' }}>{period.toUpperCase()}</h5><div style={{ fontSize: '18px', fontWeight: '950', color: '#fff', marginTop: '2px' }}>{stats?.revenue?.[period]?.toLocaleString()} <span style={{ fontSize: '10px', color: '#444' }}>UZS</span></div></div>
                                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: '#7000ff', fontWeight: 'bold' }}>{stats?.flow?.[period] || 0} MIJOZ</div></div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: '950', marginBottom: '25px', letterSpacing: '-1px' }}>KLUB XARITASI</h2>
                        {rooms.map(room => (
                            <motion.div key={room.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedViewRoom(room)} style={{ background: '#111', borderRadius: '40px', padding: '28px', border: '1px solid #1a1a1a', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>{room.name.toUpperCase()}</h3><p style={{ margin: '5px 0 0', fontSize: '12px', color: '#444', fontWeight: 'bold' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS/S</p></div>
                                <div style={{ background: '#1c1c1e', padding: '12px', borderRadius: '18px' }}><ChevronRight color="#333" /></div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: '1px solid #222', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft size={20} /></button>
                            <div><h2 style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>{currentRoomFromState.name.toUpperCase()}</h2><p style={{ margin: 0, fontSize: '11px', color: '#7000ff', fontWeight: 'bold' }}>{currentRoomFromState.Computers?.length} TA PC</p></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {currentRoomFromState.Computers?.map(pc => renderPC(pc, currentRoomFromState))}
                        </div>
                    </motion.div>
                )}

                {/* 👤 USERS MANAGEMENT (NEW & PREMIUM) */}
                {activeTab === 'users' && (
                    <motion.div key="users" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: '950', marginBottom: '20px' }}>MIJOZLAR</h2>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                            <input placeholder="ID yoki Ism bo'yicha qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '22px 22px 22px 55px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff', fontSize: '15px' }} />
                        </div>
                        {usersList.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.2, marginTop: '50px' }}>Hech kim topilmadi</p> :
                            usersList.map(u => (
                                <div key={u.id} style={{ background: '#111', borderRadius: '30px', padding: '20px', marginBottom: '12px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#7000ff15', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#7000ff' }}>{u.id}</div>
                                        <div><h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>{(u.username || 'Noma\'lum').toUpperCase()}</h4><p style={{ margin: 2, fontSize: '11px', color: '#39ff14', fontWeight: 'bold' }}>{u.balance?.toLocaleString()} UZS</p></div>
                                    </div>
                                    <button onClick={() => setSelectedUser(u)} style={{ background: '#7000ff', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>BALANS +</button>
                                </div>
                            ))
                        }
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '26px', fontWeight: '950', marginBottom: '25px' }}>TASDIQLAR ({topupRequests.length})</h2>
                        {topupRequests.map(req => (
                            <div key={req.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div><h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{req.User?.username}</h4><p style={{ margin: 0, fontSize: '10px', color: '#444' }}>{new Date(req.createdAt).toLocaleString()}</p></div>
                                    <h2 style={{ margin: 0, color: '#39ff14', fontWeight: '950' }}>{req.amount?.toLocaleString()}</h2>
                                </div>
                                <button onClick={() => setSelectedReceipt(req)} style={{ width: '100%', padding: '18px', background: '#000', borderRadius: '22px', border: '1px solid #1a1a1a', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>📷 CHEKNI KO'RISH</button>
                                <div style={{ display: 'flex', gap: '12px' }}><button style={{ flex: 1, padding: '18px', borderRadius: '18px', background: '#ff444415', color: '#ff4444' }}>RAD</button><button style={{ flex: 1.5, padding: '18px', borderRadius: '18px', background: '#39ff14', color: '#000', fontWeight: '950' }}>TASDIQLASH</button></div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 💰 ADD BALANCE MODAL (FOR CASE PAYMENTS) */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => e.target === e.currentTarget && setSelectedUser(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '45px 45px 0 0', borderTop: '1px solid #1a1a1a' }}>
                            <h2 style={{ margin: '0 0 10px', fontSize: '32px', fontWeight: '950' }}>HISOBNI TO'LDIRISH</h2>
                            <p style={{ color: '#444', marginBottom: '30px' }}>Mijoz: <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedUser.username}</span> (ID: {selectedUser.id})</p>
                            <div style={{ background: '#000', padding: '30px', borderRadius: '35px', border: '1.5px solid #1a1a1a', marginBottom: '30px' }}>
                                <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', fontWeight: 'bold', marginBottom: '10px' }}>SUMMANI KIRITING (UZS)</p>
                                <input type="number" placeholder="00000" value={addBalanceAmount} onChange={e => setAddBalanceAmount(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#39ff14', fontSize: '56px', textAlign: 'center', fontWeight: '950', outline: 'none', fontFamily: 'monospace' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
                                {[5000, 10000, 20000, 50000].map(v => (
                                    <button key={v} onClick={() => setAddBalanceAmount(v.toString())} style={{ background: '#1a1a1a', border: 'none', color: '#fff', padding: '15px 5px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px' }}>+{v / 1000}k</button>
                                ))}
                            </div>
                            <button onClick={handleAddUserBalance} style={{ width: '100%', padding: '25px', background: '#39ff14', color: '#000', borderRadius: '30px', fontWeight: '950', fontSize: '18px' }}>HISOBGA QO'SHISH ✓</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🎮 PC CONTROL MODAL (KEEP AS IS BUT PREMIUM STYLE) */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => e.target === e.currentTarget && setSelectedPC(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '45px 45px 0 0', borderTop: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px' }}><h1 style={{ margin: 0, fontSize: '38px', fontWeight: '950' }}>{selectedPC.name}</h1><button onClick={() => setSelectedPC(null)} style={{ background: '#1a1a1a', border: 'none', color: '#fff', padding: '12px', borderRadius: '18px' }}><X size={24} /></button></div>
                            {((selectedPC.status || '').toLowerCase() === 'busy' || (selectedPC.status || '').toLowerCase() === 'paused') ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '35px' }}>
                                    <div style={{ background: '#000', borderRadius: '30px', padding: '25px', border: '1px solid #1a1a1a' }}><p style={{ fontSize: '9px', color: '#444', textAlign: 'center' }}>VAQT</p><h2 style={{ margin: 0, textAlign: 'center', fontSize: '32px', fontWeight: '950' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).time}</h2></div>
                                    <div style={{ background: '#000', borderRadius: '30px', padding: '25px', border: '1px solid #1a1a1a' }}><p style={{ fontSize: '9px', color: '#444', textAlign: 'center' }}>PULI</p><h2 style={{ margin: 0, textAlign: 'center', fontSize: '24px', fontWeight: '950', color: '#39ff14' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).cost?.toLocaleString()}</h2></div>
                                    <button onClick={() => handleAction('stop')} style={{ gridColumn: 'span 1', background: '#ff444415', color: '#ff4444', padding: '25px', borderRadius: '25px', fontWeight: '950', border: '1px solid #ff444433' }}>STOP ⏹️</button>
                                    <button onClick={() => handleAction((selectedPC.status || '').toLowerCase() === 'busy' ? 'pause' : 'resume')} style={{ gridColumn: 'span 1', background: '#ffee32', color: '#000', padding: '25px', borderRadius: '25px', fontWeight: '950' }}>{(selectedPC.status || '').toLowerCase() === 'busy' ? 'PAUZA' : 'DAVOM'}</button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
                                    {[30, 60, 120, null].map(v => (
                                        <button key={v} onClick={() => handleAction('start', v)} style={{ background: v ? '#111' : '#39ff14', color: v ? '#fff' : '#000', padding: '25px 0', borderRadius: '22px', border: '1px solid #222', fontWeight: '950' }}>{v ? `${v}m` : 'UNLIM'}</button>
                                    ))}
                                    <button onClick={() => setShowReservePicker(true)} style={{ gridColumn: 'span 4', padding: '22px', borderRadius: '25px', background: '#ffaa0015', color: '#ffaa00', border: '1px solid #ffaa0033', fontWeight: '950' }}>🕒 MIJOZ BRON QILISH</button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📋 BOTTOM NAV (PREMIUM ADMIN) */}
            <nav style={{ position: 'fixed', bottom: '30px', left: '20px', right: '20px', background: 'rgba(12,12,15,0.8)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px 0', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                {navItem('stats', 'Status', <LayoutGrid size={22} color={activeTab === 'stats' ? '#7000ff' : '#444'} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} color={activeTab === 'rooms' ? '#7000ff' : '#444'} />)}
                {navItem('users', 'Mijozlar', <Users size={22} color={activeTab === 'users' ? '#7000ff' : '#444'} />)}
                {navItem('payments', 'To\'lov', <Wallet size={22} color={activeTab === 'payments' ? '#7000ff' : '#444'} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
