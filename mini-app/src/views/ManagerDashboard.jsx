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
    const [customMinutes, setCustomMinutes] = useState('');
    const [showReservePicker, setShowReservePicker] = useState(false);

    const [topupRequests, setTopupRequests] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [clubSettings, setClubSettings] = useState({ cardNumber: '', cardOwner: '' });

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [s, r, t] = await Promise.all([
                callAPI(`/api/manager/stats?t=${timestamp}`),
                callAPI(`/api/manager/rooms?t=${timestamp}`),
                callAPI(`/api/manager/topups?t=${timestamp}`)
            ]);

            const freshRooms = Array.isArray(r) ? r : [];
            setStats(s && !s.error ? s : null);
            setRooms(freshRooms);
            setTopupRequests(Array.isArray(t) ? t : []);
            if (s?.cardNumber) setClubSettings({ cardNumber: s.cardNumber, cardOwner: s.cardName || s.cardOwner || '' });

            if (selectedPC) {
                const allPCs = freshRooms.flatMap(rm => rm.Computers || []);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
                if (freshPC) {
                    const room = freshRooms.find(rm => rm.id === freshPC.RoomId);
                    setSelectedPC({ ...freshPC, roomPrice: room?.pricePerHour || selectedPC.roomPrice || 15000 });
                }
            }
        } catch (err) { console.error("Fetch error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 3000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
    }, []);

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

        setRooms(prevRooms => prevRooms.map(room => ({
            ...room,
            Computers: room.Computers.map(c => c.id === pcId ? { ...c, status: newStatus } : c)
        })));

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
                setCustomMinutes('');
                setReserveNameInput('');
                setReserveTimeInput('');
            } else {
                fetchData();
                alert(res.error || res.message);
            }
        } catch (e) { fetchData(); alert(e.message); }
        setActionLoading(false);
    };

    const handleApproveTopup = async (id, action, amount) => {
        if (!window.confirm(action === 'approve' ? "Tasdiqlaysizmi?" : "Rad etasizmi?")) return;
        try {
            const res = await callAPI(`/api/manager/topups/${id}/action`, { method: 'POST', body: JSON.stringify({ action, amount }) });
            if (res.success) { fetchData(); } else alert(res.error);
        } catch (e) { alert(e.message); }
    };

    const handleUpdateCard = async () => {
        try {
            const res = await callAPI('/api/manager/club/card', { method: 'PATCH', body: JSON.stringify(clubSettings) });
            if (res.success) alert("Saqlandi!"); else alert(res.error);
        } catch (e) { alert(e.message); }
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return;
        setIsBroadcasting(true);
        try {
            await callAPI('/api/manager/broadcast', { method: 'POST', body: JSON.stringify({ message: broadcastMessage }) });
            alert('Xabar yuborildi!');
            setBroadcastMessage('');
        } catch (e) { alert('Xato: ' + e.message); }
        setIsBroadcasting(false);
    };

    const renderPC = (pc, room) => {
        const status = (pc.status || '').toLowerCase();
        const isActive = status === 'busy' || status === 'paused';
        const { time, progress } = calculateSessionInfo(pc, room.pricePerHour);
        const reservation = pc.Sessions?.find(s => s.status === 'paused' && s.reserveTime);

        const getStatusTheme = () => {
            if (status === 'busy') return { color: '#ff00ff', icon: <MonitorPlay size={28} />, label: time };
            if (status === 'paused') return { color: '#ffee32', icon: <Clock size={28} />, label: `PAUZA` };
            if (status === 'reserved' || (reservation && status !== 'busy')) return { color: '#ffaa00', icon: <CalendarClock size={28} />, label: 'BRON' };
            if (status === 'vip') return { color: '#00ffff', icon: <Crown size={28} />, label: 'VIP' };
            // Default to Free if not busy/paused/reserved
            if (status === 'free' || status === 'available' || status === 'off' || !status) return { color: '#39ff14', icon: <Monitor size={28} />, label: 'BO\'SH' };
            return { color: '#444', icon: <PowerOff size={28} />, label: 'O\'CHIQ' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: room.pricePerHour })} style={{ background: 'linear-gradient(145deg, #111, #050505)', border: `1.5px solid ${isActive ? color : '#222'}`, borderRadius: '22px', padding: '20px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: isActive ? `0 10px 20px ${color}11` : 'none' }}>
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%` }} />}
                <div style={{ color: color, marginBottom: '8px', display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 0 5px ${color}44)` }}>{icon}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}>{pc.name}</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isActive ? color : '#555', marginTop: '3px' }}>{label}</div>
            </motion.div>
        );
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff', fontSize: '30px' }}>⚡</div>;

    const currentRoomFromState = rooms.find(r => r.id === selectedViewRoom?.id) || selectedViewRoom;

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '0.1px' }}>{(stats?.clubName || 'GAMEZONE').toUpperCase()} <span style={{ color: '#39ff14', fontSize: '10px', verticalAlign: 'middle', marginLeft: '5px' }}>●</span></h2>
                <button onClick={onLogout} style={{ background: '#ff444415', border: 'none', color: '#ff4444', padding: '10px 18px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold' }}>LOGOUT</button>
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
                                    const deltaMs = Math.max(0, nowTime - start.getTime());
                                    const pph = rooms.find(r => r.id === pc.RoomId)?.pricePerHour || 15000;
                                    liveTotalDay += (deltaMs / 3600000) * pph;
                                }
                            });
                            return (
                                <div style={{ background: '#0a0a0c', padding: '40px 20px', borderRadius: '45px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', marginBottom: '25px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: '900', letterSpacing: '2px', opacity: 0.8 }}>DAROMAD (LIVE)</p>
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '8px', height: '8px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }} />
                                    </div>
                                    <h1 style={{ margin: 0, fontSize: '62px', fontWeight: '900', color: '#fff', letterSpacing: '-2px', fontFamily: 'monospace' }}>{Math.round(liveTotalDay).toLocaleString()}</h1>
                                </div>
                            );
                        })()}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
                            {[
                                { l: 'JAMI', v: stats?.totalPCs, c: '#fff' },
                                { l: 'BAND', v: stats?.busyPCs, c: '#ff00ff' },
                                { l: 'BRON', v: stats?.reservedPCs || 0, c: '#ffaa00' },
                                { l: 'BO\'SH', v: stats?.freePCs, c: '#39ff14' }
                            ].map((item, i) => (
                                <div key={i} style={{ background: '#111', padding: '15px 5px', borderRadius: '22px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '9px', color: '#555', fontWeight: 'bold' }}>{item.l}</p>
                                    <h3 style={{ margin: '5px 0 0', fontSize: '18px', color: item.c, fontWeight: '900' }}>{item.v}</h3>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {['day', 'week', 'month', 'year'].map(period => (
                                <div key={period} style={{ background: 'linear-gradient(90deg, #111, #0a0a0a)', border: '1px solid #1a1a1a', padding: '18px 25px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div><h5 style={{ margin: 0, fontSize: '10px', color: '#444' }}>{period.toUpperCase()}</h5><div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{stats?.revenue?.[period]?.toLocaleString()} <span style={{ fontSize: '10px', color: '#333' }}>UZS</span></div></div>
                                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: '#7000ff', fontWeight: 'bold' }}>{stats?.flow?.[period] || 0} MIJOZ</div></div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px' }}>XARITA</h2>
                        {rooms.map(room => (
                            <motion.div key={room.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedViewRoom(room)} style={{ background: '#111', borderRadius: '35px', padding: '25px', border: '1px solid #1a1a1a', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3><p style={{ margin: '5px 0 0', fontSize: '12px', color: '#555' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS/S</p></div>
                                <div style={{ background: '#1c1c1e', padding: '12px', borderRadius: '18px' }}><ChevronRight color="#333" /></div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: '1px solid #222', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft size={20} /></button>
                            <div><h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{currentRoomFromState.name.toUpperCase()}</h2><p style={{ margin: 0, fontSize: '11px', color: '#7000ff', fontWeight: 'bold' }}>{currentRoomFromState.Computers?.length} TA PC</p></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {currentRoomFromState.Computers?.map(pc => renderPC(pc, currentRoomFromState))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px' }}>TO'LOVLAR ({topupRequests.length})</h2>
                        {topupRequests.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.2, marginTop: '100px' }}>Yo'q</p> :
                            topupRequests.map(req => (
                                <div key={req.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <div><h4 style={{ margin: 0, fontSize: '18px' }}>{req.User?.username}</h4><p style={{ margin: 0, fontSize: '10px', color: '#444' }}>{new Date(req.createdAt).toLocaleString()}</p></div>
                                        <h2 style={{ margin: 0, color: '#39ff14', fontWeight: '900' }}>{req.amount?.toLocaleString()}</h2>
                                    </div>
                                    <button onClick={() => setSelectedReceipt(req)} style={{ width: '100%', padding: '18px', background: '#222', borderRadius: '20px', border: 'none', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>📷 CHEK</button>
                                    <div style={{ display: 'flex', gap: '12px' }}><button onClick={() => handleApproveTopup(req.id, 'reject')} style={{ flex: 1, padding: '18px', borderRadius: '18px', background: '#ff444415', color: '#ff4444' }}>RAD</button><button onClick={() => handleApproveTopup(req.id, 'approve')} style={{ flex: 1.5, padding: '18px', borderRadius: '18px', background: '#39ff14', color: '#000', fontWeight: '900' }}>OK</button></div>
                                </div>
                            ))
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACTION MODAL (FORCE RE-RENDERABLE LOGIC) */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedPC(null); }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#111', width: '100%', padding: '35px 25px', borderRadius: '45px 45px 0 0', borderTop: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}><h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900' }}>{selectedPC.name}</h2><button onClick={() => setSelectedPC(null)} style={{ background: '#222', border: 'none', color: '#fff', padding: '12px', borderRadius: '15px' }}><X size={22} /></button></div>

                            {/* ACTIVE SESSION HUD */}
                            {((selectedPC.status || '').toLowerCase() === 'busy' || (selectedPC.status || '').toLowerCase() === 'paused') && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ background: '#000', borderRadius: '30px', padding: '25px', textAlign: 'center', border: '1.5px solid #7000ff33' }}>
                                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>VAQT O'TDI</div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).time}</div>
                                    </div>
                                    <div style={{ background: '#000', borderRadius: '30px', padding: '25px', textAlign: 'center', border: '1.5px solid #39ff1433' }}>
                                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>HISOB (UZS)</div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#39ff14' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).cost?.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            {/* DYNAMIC ACTION BUTTONS (ROBUST LOGIC) */}
                            {!showReservePicker ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {/* IF BUSY/PAUSED */}
                                    {((selectedPC.status || '').toLowerCase() === 'busy' || (selectedPC.status || '').toLowerCase() === 'paused') ? (
                                        <><button onClick={() => handleAction('stop')} disabled={actionLoading} style={{ background: '#ff444415', border: '1.5px solid #ff444444', color: '#ff4444', padding: '25px', borderRadius: '25px', fontWeight: '950' }}>STOP ⏹️</button>
                                            {(selectedPC.status || '').toLowerCase() === 'busy' ? <button onClick={() => handleAction('pause')} disabled={actionLoading} style={{ background: '#ffee32', color: '#000', padding: '25px', borderRadius: '25px', fontWeight: '950' }}>PAUSE ⏸️</button> : <button onClick={() => handleAction('resume')} disabled={actionLoading} style={{ background: '#39ff14', color: '#000', padding: '25px', borderRadius: '25px', fontWeight: '950' }}>RESUME ▶️</button>}</>
                                    ) : (
                                        /* IF FREE OR RESERVED (SHOW START/RESERVE) */
                                        <><div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                            <button onClick={() => handleAction('start', 30)} disabled={actionLoading} style={{ background: '#1c1c1e', color: '#fff', padding: '20px 0', borderRadius: '22px', border: '1px solid #333', fontWeight: 'bold' }}>30m</button>
                                            <button onClick={() => handleAction('start', 60)} disabled={actionLoading} style={{ background: '#1c1c1e', color: '#fff', padding: '20px 0', borderRadius: '22px', border: '1px solid #333', fontWeight: 'bold' }}>1s</button>
                                            <button onClick={() => handleAction('start', 120)} disabled={actionLoading} style={{ background: '#1c1c1e', color: '#fff', padding: '20px 0', borderRadius: '22px', border: '1px solid #333', fontWeight: 'bold' }}>2s</button>
                                            <button onClick={() => handleAction('start', null)} disabled={actionLoading} style={{ background: '#39ff14', color: '#000', padding: '20px 0', borderRadius: '22px', fontWeight: '950' }}>GO</button>
                                        </div>
                                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px' }}>
                                                <input type="number" placeholder="Da..." value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} style={{ flex: 1.5, background: '#000', border: '1.5px solid #1a1a1a', borderRadius: '22px', padding: '18px', color: '#fff', textAlign: 'center', fontSize: '18px' }} />
                                                <button onClick={() => handleAction('start', parseInt(customMinutes))} disabled={!customMinutes || actionLoading} style={{ flex: 1, background: '#7000ff', color: '#fff', borderRadius: '22px', fontWeight: '900' }}>START</button>
                                            </div>
                                            {((selectedPC.status || '').toLowerCase() === 'reserved') ? (
                                                <button onClick={() => handleAction('cancel_reserve')} disabled={actionLoading} style={{ gridColumn: 'span 2', padding: '25px', borderRadius: '25px', background: '#ff4444', color: '#fff', fontWeight: '950' }}>BEKOR ❌</button>
                                            ) : (
                                                <button onClick={() => setShowReservePicker(true)} disabled={actionLoading} style={{ gridColumn: 'span 2', padding: '22px', borderRadius: '25px', background: '#ffaa0015', color: '#ffaa00', border: '1.5px solid #ffaa0044', fontWeight: '950' }}>🕒 BRON QILISH</button>
                                            )}</>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#000', padding: '30px', borderRadius: '40px', border: '1px solid #1a1a1a' }}>
                                    <h3 style={{ margin: '0 0 20px', textAlign: 'center', fontWeight: '900' }}>REZERV</h3>
                                    <input placeholder="Mijoz ismi" value={reserveNameInput} onChange={e => setReserveNameInput(e.target.value)} style={{ width: '100%', padding: '20px', background: '#111', border: '1.5px solid #1a1a1a', borderRadius: '22px', color: '#fff', marginBottom: '12px' }} />
                                    <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '20px', background: '#111', border: '1.5px solid #1a1a1a', borderRadius: '22px', color: '#fff', marginBottom: '25px', fontSize: '28px', textAlign: 'center', fontWeight: 'bold' }} />
                                    <div style={{ display: 'flex', gap: '15px' }}><button onClick={() => setShowReservePicker(false)} style={{ flex: 1, padding: '20px', borderRadius: '22px', background: '#1c1c1e', color: '#fff' }}>BEKOR</button><button onClick={() => handleAction('reserve', null, reserveTimeInput, reserveNameInput)} disabled={actionLoading} style={{ flex: 1.5, padding: '20px', borderRadius: '22px', background: '#ffaa00', color: '#000', fontWeight: '950' }}>OK</button></div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>{selectedReceipt && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <img src={`${API_URL}/${selectedReceipt.receiptImage.replace(/\\/g, '/')}`} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '35px' }} />
                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px', width: '100%', maxWidth: '450px' }}><button onClick={() => setSelectedReceipt(null)} style={{ flex: 1, padding: '20px', background: '#1c1c1e', borderRadius: '22px', color: '#fff' }}>YOPISH</button><button onClick={() => { handleApproveTopup(selectedReceipt.id, 'approve'); setSelectedReceipt(null); }} style={{ flex: 1.5, padding: '20px', background: '#39ff14', borderRadius: '22px', color: '#000', fontWeight: '950' }}>OK ✅</button></div>
                </motion.div>
            )}</AnimatePresence>
        </div>
    );
};

export default ManagerDashboard;
