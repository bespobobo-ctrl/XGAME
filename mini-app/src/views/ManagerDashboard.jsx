import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send } from 'lucide-react';

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
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveNameInput, setReserveNameInput] = useState('');
    const [reservePhoneInput, setReservePhoneInput] = useState('');
    const [showReservePicker, setShowReservePicker] = useState(false);

    const [showAddRoom, setShowAddRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });
    const [showEditRoom, setShowEditRoom] = useState(null);

    // 💳 PAYMENT STATES
    const [topupRequests, setTopupRequests] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [clubSettings, setClubSettings] = useState({ cardNumber: '', cardOwner: '' });

    const fetchData = async () => {
        try {
            const [s, r, t] = await Promise.all([
                callAPI('/api/manager/stats'),
                callAPI('/api/manager/rooms'),
                callAPI('/api/manager/topups')
            ]);
            setStats(s && !s.error ? s : null);
            setRooms(Array.isArray(r) ? r : []);
            setTopupRequests(Array.isArray(t) ? t : []);

            if (s?.cardNumber) {
                setClubSettings({ cardNumber: s.cardNumber, cardOwner: s.cardOwner || '' });
            }

            // Update selected PC data if modal is open
            if (selectedPC && Array.isArray(r)) {
                const allPCs = r.flatMap(rm => rm.Computers);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
                if (freshPC) setSelectedPC(freshPC);
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 4000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => {
            clearInterval(dataInterval);
            clearInterval(timerInterval);
        };
    }, []);

    const handleAction = async (action, expectedMinutes = null, reserveTime = null, guestName = null, guestPhone = null) => {
        if (!selectedPC) return;
        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, expectedMinutes, reserveTime, guestName, guestPhone })
            });

            if (res.success) {
                if (res.message) alert(res.message);
                fetchData();
                setShowReservePicker(false);
            } else {
                alert('Xatolik: ' + (res.error || res.message));
            }
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleApproveTopup = async (id, action, amount) => {
        if (!window.confirm(action === 'approve' ? "To'lovni tasdiqlaysizmi?" : "To'lovni rad etasizmi?")) return;
        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/topups/${id}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, amount })
            });
            if (res.success) {
                alert(res.message);
                fetchData();
            } else alert(res.error);
        } catch (e) { alert(e.message); }
        setActionLoading(false);
    };

    const handleUpdateCard = async () => {
        setActionLoading(true);
        try {
            const res = await callAPI('/api/manager/club/card', {
                method: 'PATCH',
                body: JSON.stringify(clubSettings)
            });
            if (res.success) alert("Saqlandi!");
            else alert(res.error);
        } catch (e) { alert(e.message); }
        setActionLoading(false);
    };

    const handleAddRoom = async () => {
        if (!newRoom.name) return alert('Xona nomini kiriting!');
        setActionLoading(true);
        try {
            await callAPI('/api/manager/setup', {
                method: 'POST',
                body: JSON.stringify({ rooms: [newRoom] })
            });
            fetchData();
            setShowAddRoom(false);
            setNewRoom({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });
        } catch (e) { alert('Xato: ' + e.message); }
        setActionLoading(false);
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        setIsBroadcasting(true);
        try {
            await callAPI('/api/manager/broadcast', {
                method: 'POST',
                body: JSON.stringify({ message: broadcastMessage })
            });
            alert('Xabar yuborildi!');
            setBroadcastMessage('');
        } catch (e) { alert('Xato: ' + e.message); }
        setIsBroadcasting(false);
    };

    const renderPC = (pc, room) => {
        const isActive = pc.status === 'busy' || pc.status === 'paused';
        let elapsedTime = "00:00:00";
        let progress = 0;

        const activeSession = pc.Sessions?.find(s => s.status === 'active' || (s.status === 'paused' && !s.reserveTime));
        const reservation = pc.Sessions?.find(s => s.status === 'paused' && s.reserveTime);

        if (activeSession) {
            const start = new Date(activeSession.startTime);
            const now = new Date();
            const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt) : nowTime;
            const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
            const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (diffSeconds % 60).toString().padStart(2, '0');
            elapsedTime = `${h}:${m}:${s}`;
            progress = Math.min((diffSeconds / 3600) * 100, 100);
        }

        const getStatusTheme = () => {
            if (pc.status === 'free') return { color: '#39ff14', icon: <Monitor size={28} />, label: 'BO\'SH' };
            if (pc.status === 'busy') return { color: '#ff00ff', icon: <MonitorPlay size={28} />, label: elapsedTime };
            if (pc.status === 'paused') return { color: '#ffee32', icon: <Clock size={28} />, label: `PAUZA` };
            if (pc.status === 'reserved' || reservation) return { color: '#ffaa00', icon: <CalendarClock size={28} />, label: 'BRON' };
            if (pc.status === 'vip') return { color: '#00ffff', icon: <Crown size={28} />, label: 'VIP' };
            return { color: '#444', icon: <PowerOff size={28} />, label: 'OFF' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div
                key={pc.id} whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setSelectedPC(pc);
                    const now = new Date();
                    const nextHour = new Date(now.getTime() + 60 * 60000);
                    setReserveNameInput('Mehmon');
                    setReserveTimeInput(`${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`);
                    setShowReservePicker(false);
                }}
                style={{ background: '#111', border: `1px solid ${isActive ? color + '44' : '#222'}`, borderTop: `2px solid ${isActive ? color : '#333'}`, borderRadius: '20px', padding: '20px 10px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%` }} />}
                <div style={{ color: color, marginBottom: '10px' }}>{icon}</div>
                <span style={{ fontSize: '12px', fontWeight: '900' }}>{pc.name}</span>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isActive ? color : '#666', marginTop: '5px' }}>{label}</div>
            </motion.div>
        );
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: '40px' }}>⚡</motion.div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '120px' }}>
            <header style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{stats?.clubName || 'GAME ZONE'}</h2>
                    <span style={{ fontSize: '10px', color: '#39ff14' }}>● MANAGER ONLINE</span>
                </div>
                <button onClick={onLogout} style={{ background: '#ff444422', border: '1px solid #ff444444', color: '#ff4444', padding: '8px 15px', borderRadius: '12px', fontSize: '10px' }}>LOGOUT</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '20px' }}>
                        {/* Summary Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>BUGUN</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#39ff14' }}>{stats?.revenue?.day?.toLocaleString()}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center', position: 'relative' }}>
                                {topupRequests.length > 0 && <div style={{ position: 'absolute', top: -5, right: -5, background: '#ff4444', color: '#fff', fontSize: '10px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{topupRequests.length}</div>}
                                <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>KUTILAYOTGAN</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#ffaa00' }}>{topupRequests.length}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>BAND PC</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: '#ff00ff' }}>{stats?.busyPCs || 0}</h3>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '11px', color: '#888', letterSpacing: '1px' }}>OXIRGI TASHRIFLAR</h4>
                            {stats?.recentSessions?.slice(0, 5).map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{s.user}</div>
                                        <div style={{ fontSize: '10px', color: '#444' }}>{s.pc} • {s.duration} min</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '13px', color: '#39ff14' }}>{s.cost?.toLocaleString()}</div>
                                        <div style={{ fontSize: '9px', color: '#333' }}>{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Broadcast Message */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '11px', color: '#ffaa00' }}>📣 HABAR YUBORISH (BOT)</h4>
                            <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Barcha foydalanuvchilarga..." style={{ width: '100%', height: '80px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', padding: '12px', fontSize: '13px', resize: 'none' }} />
                            <button onClick={handleBroadcast} disabled={isBroadcasting} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#ffaa00', color: '#000', fontWeight: 'bold', marginTop: '10px' }}>{isBroadcasting ? '...' : 'YUBORISH 🚀'}</button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>KLUB XARITASI</h2>
                            <button onClick={() => setShowAddRoom(true)} style={{ background: '#7000ff', color: '#fff', padding: '10px 15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '11px' }}>+ XONA</button>
                        </div>
                        {rooms.map(room => (
                            <motion.div
                                key={room.id} whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedViewRoom(room)}
                                style={{ background: '#111', borderRadius: '25px', padding: '20px', border: '1px solid #222', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3>
                                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#444' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS/S</p>
                                </div>
                                <ChevronRight color="#333" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: '1px solid #333', color: '#fff', width: '40px', height: '40px', borderRadius: '12px' }}><ArrowLeft size={18} /></button>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>{selectedViewRoom.name.toUpperCase()}</h2>
                                <p style={{ margin: 0, fontSize: '11px', color: '#7000ff' }}>{selectedViewRoom.Computers?.length} ta kompyuter</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                            {selectedViewRoom.Computers?.map(pc => renderPC(pc, selectedViewRoom))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>TO'LOVLARNI TASDIQLASH</h2>
                        {topupRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
                                <CreditCard size={50} style={{ margin: '0 auto 10px' }} />
                                <p>To'lovlar yo'q</p>
                            </div>
                        ) : (
                            topupRequests.map(req => (
                                <div key={req.id} style={{ background: '#111', borderRadius: '25px', padding: '20px', border: '1px solid #222', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '16px' }}>{req.User?.username}</h4>
                                            <p style={{ margin: 0, fontSize: '10px', color: '#444' }}>{new Date(req.createdAt).toLocaleString()}</p>
                                        </div>
                                        <h4 style={{ margin: 0, color: '#39ff14' }}>{req.amount?.toLocaleString()}</h4>
                                    </div>
                                    <button onClick={() => setSelectedReceipt(req)} style={{ width: '100%', background: '#222', color: '#fff', border: 'none', padding: '12px', borderRadius: '15px', marginBottom: '15px', fontSize: '12px' }}>📷 CHEKNI KO'RISH</button>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApproveTopup(req.id, 'reject')} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ff444422', color: '#ff4444', border: 'none', fontWeight: 'bold', fontSize: '12px' }}>RAD ETISH</button>
                                        <button onClick={() => handleApproveTopup(req.id, 'approve')} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#39ff14', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '12px' }}>TASDIQLASH</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '12px', color: '#7000ff' }}>TO'LOV SOZLAMALARI</h4>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '11px', color: '#444', display: 'block', marginBottom: '5px' }}>KARTA RAQAMI:</label>
                                <input value={clubSettings.cardNumber} onChange={e => setClubSettings({ ...clubSettings, cardNumber: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#000', border: '1px solid #222', color: '#fff' }} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', color: '#444', display: 'block', marginBottom: '5px' }}>KARTA EGASI:</label>
                                <input value={clubSettings.cardOwner} onChange={e => setClubSettings({ ...clubSettings, cardOwner: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: '#000', border: '1px solid #222', color: '#fff' }} />
                            </div>
                            <button onClick={handleUpdateCard} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#7000ff', color: '#fff', fontWeight: 'bold' }}>SAQLASH ✅</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PC ACTION MODAL */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
                        onClick={(e) => { if (e.target === e.currentTarget) setSelectedPC(null); }}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            style={{ background: '#111', width: '100%', padding: '30px', borderRadius: '35px 35px 0 0', borderTop: '1px solid #222' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{selectedPC.name}</h2>
                                    <span style={{ color: '#888', fontSize: '12px' }}>STATUS: {selectedPC.status.toUpperCase()}</span>
                                </div>
                                <X onClick={() => setSelectedPC(null)} style={{ opacity: 0.5 }} />
                            </div>

                            {!showReservePicker ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    {(selectedPC.status === 'free' || selectedPC.status === 'vip') && (
                                        <>
                                            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                                                <button onClick={() => handleAction('start', 30)} style={{ background: '#222', color: '#39ff14', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>30M</button>
                                                <button onClick={() => handleAction('start', 60)} style={{ background: '#222', color: '#39ff14', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>1S</button>
                                                <button onClick={() => handleAction('start', 120)} style={{ background: '#222', color: '#39ff14', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>2S</button>
                                                <button onClick={() => handleAction('start', null)} style={{ background: '#39ff14', color: '#000', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>GO</button>
                                            </div>
                                            <button onClick={() => setShowReservePicker(true)} style={{ gridColumn: 'span 2', padding: '18px', borderRadius: '20px', background: '#ffaa0022', color: '#ffaa00', border: '1px solid #ffaa0033', fontWeight: '900' }}>🕒 BRON QILISH (RESERVE)</button>
                                        </>
                                    )}

                                    {(selectedPC.status === 'busy' || selectedPC.status === 'paused') && (
                                        <>
                                            <button onClick={() => handleAction('stop')} style={{ background: '#ff444422', border: '1px solid #ff444433', color: '#ff4444', padding: '20px', borderRadius: '20px', fontWeight: 'bold' }}>STOP ⏹️</button>
                                            {selectedPC.status === 'busy' ? (
                                                <button onClick={() => handleAction('pause')} style={{ background: '#ffee32', color: '#000', padding: '20px', borderRadius: '20px', fontWeight: 'bold' }}>PAUSE ⏸️</button>
                                            ) : (
                                                <button onClick={() => handleAction('resume')} style={{ background: '#39ff14', color: '#000', padding: '20px', borderRadius: '20px', fontWeight: 'bold' }}>RESUME ▶️</button>
                                            )}
                                        </>
                                    )}

                                    {selectedPC.status === 'reserved' && (
                                        <button onClick={() => handleAction('cancel_reserve')} style={{ gridColumn: 'span 2', padding: '20px', borderRadius: '20px', background: '#ff4444', color: '#fff', fontWeight: 'bold' }}>BRONNI BEKOR QILISH ❌</button>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#000', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                    <h3 style={{ margin: '0 0 15px', textAlign: 'center' }}>Bron:</h3>
                                    <input placeholder="Mijoz ismi" value={reserveNameInput} onChange={e => setReserveNameInput(e.target.value)} style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '10px' }} />
                                    <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px', fontSize: '20px', textAlign: 'center' }} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setShowReservePicker(false)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#222', color: '#fff' }}>BEKOR</button>
                                        <button onClick={() => handleAction('reserve', null, reserveTimeInput, reserveNameInput)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#ffaa00', color: '#000', fontWeight: 'bold' }}>SAQLASH</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {selectedReceipt && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <img src={`${API_URL}/${selectedReceipt.receiptImage.replace(/\\/g, '/')}`} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '20px' }} />
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={() => setSelectedReceipt(null)} style={{ padding: '15px 30px', background: '#333', borderRadius: '15px', color: '#fff' }}>YOPISH</button>
                            <button onClick={() => { handleApproveTopup(selectedReceipt.id, 'approve'); setSelectedReceipt(null); }} style={{ padding: '15px 30px', background: '#39ff14', borderRadius: '15px', color: '#000', fontWeight: 'bold' }}>TASDIQLASH</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Room Modal */}
            <AnimatePresence>
                {showAddRoom && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ background: '#111', padding: '25px', borderRadius: '30px', width: '100%', maxWidth: '400px' }}>
                            <h3 style={{ textAlign: 'center' }}>+ YANGI XONA</h3>
                            <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="Xona nomi" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', borderRadius: '12px', margin: '15px 0' }} />
                            <input type="number" value={newRoom.pricePerHour} onChange={e => setNewRoom({ ...newRoom, pricePerHour: parseInt(e.target.value) })} placeholder="Narxi" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', borderRadius: '12px', marginBottom: '15px' }} />
                            <input type="number" value={newRoom.pcCount} onChange={e => setNewRoom({ ...newRoom, pcCount: parseInt(e.target.value) })} placeholder="PC soni" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', borderRadius: '12px', marginBottom: '20px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowAddRoom(false)} style={{ flex: 1, padding: '12px', background: '#222', borderRadius: '12px' }}>BEKOR</button>
                                <button onClick={handleAddRoom} style={{ flex: 1, padding: '12px', background: '#7000ff', borderRadius: '12px', fontWeight: 'bold' }}>QO'SHISH</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManagerDashboard;
