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
                setClubSettings({ cardNumber: s.cardNumber, cardOwner: s.cardName || s.cardOwner || '' });
            }

            if (selectedPC && Array.isArray(r)) {
                const allPCs = r.flatMap(rm => rm.Computers || []);
                const freshPC = allPCs.find(p => p.id === selectedPC.id);
                if (freshPC) setSelectedPC(freshPC);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 4000);
        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000);
        return () => { clearInterval(dataInterval); clearInterval(timerInterval); };
    }, []);

    const handleAction = async (action, expectedMinutes = null, reserveTime = null, guestName = null) => {
        if (!selectedPC) return;
        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST',
                body: JSON.stringify({ action, expectedMinutes, reserveTime, guestName })
            });
            if (res.success) {
                fetchData();
                setShowReservePicker(false);
                setCustomMinutes('');
            } else { alert(res.error || res.message); }
        } catch (e) { alert(e.message); }
        setActionLoading(false);
    };

    const handleApproveTopup = async (id, action, amount) => {
        if (!window.confirm(action === 'approve' ? "Tasdiqlaysizmi?" : "Rad etasizmi?")) return;
        try {
            const res = await callAPI(`/api/manager/topups/${id}/action`, { method: 'POST', body: JSON.stringify({ action, amount }) });
            if (res.success) { alert(res.message); fetchData(); } else alert(res.error);
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
        const isActive = pc.status === 'busy' || pc.status === 'paused';
        let elapsedTime = "00:00:00";
        let progress = 0;
        let livesCost = 0;

        const activeSession = pc.Sessions?.find(s => s.status === 'active' || (s.status === 'paused' && !s.reserveTime));
        const reservation = pc.Sessions?.find(s => s.status === 'paused' && s.reserveTime);

        if (activeSession) {
            const start = new Date(activeSession.startTime);
            const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt) : nowTime;
            const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
            const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
            const s = (diffSeconds % 60).toString().padStart(2, '0');
            elapsedTime = `${h}:${m}:${s}`;
            progress = Math.min((diffSeconds / 3600) * 100, 100);
            livesCost = Math.floor((diffSeconds / 3600) * room.pricePerHour);
        }

        const getStatusTheme = () => {
            if (pc.status === 'free') return { color: '#39ff14', icon: <Monitor size={28} />, label: 'BO\'SH' };
            if (pc.status === 'busy') return { color: '#ff00ff', icon: <MonitorPlay size={28} />, label: elapsedTime };
            if (pc.status === 'paused') return { color: '#ffee32', icon: <Clock size={28} />, label: `PAUZA` };
            if (pc.status === 'reserved' || (reservation && pc.status !== 'busy')) return { color: '#ffaa00', icon: <CalendarClock size={28} />, label: 'BRON' };
            if (pc.status === 'vip') return { color: '#00ffff', icon: <Crown size={28} />, label: 'VIP' };
            return { color: '#444', icon: <PowerOff size={28} />, label: 'O\'CHIQ' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: room.pricePerHour })} style={{ background: '#111', border: `1.5px solid ${isActive ? color : '#222'}`, borderRadius: '22px', padding: '15px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%` }} />}
                <div style={{ color: color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{pc.name}</div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isActive ? color : '#555', marginTop: '3px' }}>{label}</div>
            </motion.div>
        );
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff', fontSize: '30px' }}>⚡</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '120px', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(15px)', zIndex: 100, borderBottom: '1px solid #111' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{stats?.clubName?.toUpperCase() || 'GAMEZONE'} <span style={{ color: '#39ff14', fontSize: '10px', verticalAlign: 'middle', marginLeft: '5px' }}>●</span></h2>
                <button onClick={onLogout} style={{ background: '#ff444415', border: 'none', color: '#ff4444', padding: '10px 18px', borderRadius: '14px', fontSize: '11px', fontWeight: 'bold' }}>CHIQISH</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '20px' }}>

                        {/* 🔔 URGENT ALERT */}
                        {stats?.urgentReservations?.length > 0 && (
                            <div style={{ background: 'linear-gradient(90deg, #ffaa00, #ff4444)', padding: '15px', borderRadius: '25px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: '#000', fontWeight: 'bold' }}>DIQQAT: BRON VAQTI YAQINLASHDI!</h4>
                                    {stats.urgentReservations.map((ur, i) => (
                                        <p key={i} style={{ margin: '2px 0 0', fontSize: '11px', color: '#000' }}>{ur.pc} - {ur.user} ({ur.phone || 'Tel topilmadi'}).</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 💰 LIVE REVENUE HUD */}
                        {(() => {
                            let liveTotalDay = stats?.revenue?.day || 0;
                            let isTicking = false;
                            rooms.flatMap(r => r.Computers || []).forEach(pc => {
                                const activeSession = pc.Sessions?.find(s => s.status === 'active');
                                if (activeSession) {
                                    isTicking = true;
                                    const start = new Date(activeSession.startTime);
                                    const deltaMs = Math.max(0, nowTime - start.getTime());
                                    const pph = rooms.find(r => r.id === pc.RoomId)?.pricePerHour || 15000;
                                    liveTotalDay += (deltaMs / 3600000) * pph;
                                }
                            });

                            return (
                                <>
                                    <div style={{ background: 'linear-gradient(135deg, #111, #000)', padding: '30px', borderRadius: '40px', border: '1px solid #7000ff22', textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                                        {isTicking && <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: '20px', right: '20px', width: '8px', height: '8px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }} />}
                                        <p style={{ margin: 0, fontSize: '11px', color: '#555', letterSpacing: '2px' }}>DAROMAD (LIVE)</p>
                                        <h1 style={{ margin: '15px 0 0', fontSize: '50px', fontWeight: '900', color: '#fff', letterSpacing: '-2px' }}>{Math.round(liveTotalDay).toLocaleString()}</h1>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '25px' }}>
                                        {[
                                            { l: 'JAMI', v: stats?.totalPCs, c: '#fff' },
                                            { l: 'BAND', v: stats?.busyPCs, c: '#ff00ff' },
                                            { l: 'BRON', v: stats?.reservedPCs || 0, c: '#ffaa00' },
                                            { l: 'BO\'SH', v: stats?.freePCs, c: '#39ff14' }
                                        ].map((item, i) => (
                                            <div key={i} style={{ background: '#111', padding: '15px 5px', borderRadius: '20px', border: '1px solid #222', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: '8px', color: '#444' }}>{item.l}</p>
                                                <h3 style={{ margin: '5px 0 0', fontSize: '16px', color: item.c }}>{item.v}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}

                        {/* 📅 PERIOD STATS */}
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '25px' }}>
                            {['day', 'week', 'month', 'year'].map(period => (
                                <div key={period} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px 25px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5 style={{ margin: 0, fontSize: '11px', color: '#444' }}>{period.toUpperCase()}</h5>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                                        <div style={{ color: '#fff' }}><span style={{ color: '#333', fontSize: '10px' }}>OQIM:</span> {stats?.flow?.[period] || 0}</div>
                                        <div style={{ color: '#7000ff' }}><span style={{ color: '#333', fontSize: '10px' }}>SUMMA:</span> {stats?.revenue?.[period]?.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 🏆 TOP PLAYERS & RECENT */}
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ background: '#111', padding: '25px', borderRadius: '35px' }}>
                                <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#700b14' }}>👤 OXIRGI TASHRIFLAR</h4>
                                {stats?.recentSessions?.slice(0, 5).map((s, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                                        <div><div style={{ fontSize: '14px', fontWeight: 'bold' }}>{s.user}</div><div style={{ fontSize: '10px', color: '#444' }}>{s.pc} • {s.duration} daqiqa</div></div>
                                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: '14px', color: '#39ff14' }}>{s.cost?.toLocaleString()}</div><div style={{ fontSize: '9px', color: '#222' }}>{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 📣 BROADCAST */}
                        <div style={{ background: '#111', padding: '25px', borderRadius: '35px', marginTop: '20px', border: '1px solid #ffaa0022' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '11px', color: '#ffaa00' }}>📣 HABAR YUBORISH</h4>
                            <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} style={{ width: '100%', height: '80px', background: '#000', border: '1px solid #222', borderRadius: '20px', color: '#fff', padding: '15px' }} />
                            <button onClick={handleBroadcast} disabled={isBroadcasting} style={{ width: '100%', padding: '18px', borderRadius: '18px', background: '#ffaa00', color: '#000', fontWeight: '900', marginTop: '15px' }}>YUBORISH 🚀</button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px' }}>XONALAR</h2>
                        {rooms.map(room => (
                            <motion.div key={room.id} whileTap={{ scale: 0.98 }} onClick={() => setSelectedViewRoom(room)} style={{ background: '#111', borderRadius: '28px', padding: '22px', border: '1px solid #222', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3>
                                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#555' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS/S</p>
                                </div>
                                <div style={{ background: '#1c1c1e', padding: '10px', borderRadius: '15px' }}><ChevronRight color="#444" /></div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: '1px solid #333', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft size={20} /></button>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{selectedViewRoom.name.toUpperCase()}</h2>
                                <p style={{ margin: 0, fontSize: '11px', color: '#7000ff' }}>{selectedViewRoom.Computers?.length} kompyuter</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {selectedViewRoom.Computers?.map(pc => renderPC(pc, selectedViewRoom))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '25px' }}>TO'LOVLAR ({topupRequests.length})</h2>
                        {topupRequests.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.3, marginTop: '100px' }}>To'lovlar yo'q</p> :
                            topupRequests.map(req => (
                                <div key={req.id} style={{ background: '#111', borderRadius: '35px', padding: '30px', marginBottom: '15px', border: '1px solid #222' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div><h3 style={{ margin: 0 }}>{req.User?.username}</h3><p style={{ margin: 0, fontSize: '10px', color: '#444' }}>{new Date(req.createdAt).toLocaleString()}</p></div>
                                        <h2 style={{ margin: 0, color: '#39ff14' }}>{req.amount?.toLocaleString()}</h2>
                                    </div>
                                    <button onClick={() => setSelectedReceipt(req)} style={{ width: '100%', padding: '15px', background: '#222', borderRadius: '15px', border: 'none', color: '#fff', fontWeight: 'bold', marginBottom: '15px' }}>📷 CHEKNI KO'RISH</button>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleApproveTopup(req.id, 'reject')} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#ff444415', color: '#ff4444', border: 'none' }}>RAD ETISH</button>
                                        <button onClick={() => handleApproveTopup(req.id, 'approve')} style={{ flex: 1.5, padding: '15px', borderRadius: '15px', background: '#39ff14', color: '#000', border: 'none', fontWeight: 'bold' }}>TASDIQLASH</button>
                                    </div>
                                </div>
                            ))
                        }
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '30px', borderRadius: '40px', border: '1px solid #222' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '12px', color: '#7000ff' }}>TO'LOV SOZLAMALARI</h4>
                            <div style={{ marginBottom: '15px' }}><label style={{ fontSize: '11px', color: '#444' }}>KARTA RAQAMI:</label><input value={clubSettings.cardNumber} onChange={e => setClubSettings({ ...clubSettings, cardNumber: e.target.value })} style={{ width: '100%', padding: '18px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '18px' }} /></div>
                            <div style={{ marginBottom: '20px' }}><label style={{ fontSize: '11px', color: '#444' }}>KARTA EGASI:</label><input value={clubSettings.cardOwner} onChange={e => setClubSettings({ ...clubSettings, cardOwner: e.target.value })} style={{ width: '100%', padding: '18px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '18px' }} /></div>
                            <button onClick={handleUpdateCard} style={{ width: '100%', padding: '20px', background: '#7000ff', color: '#fff', borderRadius: '18px', fontWeight: 'bold' }}>SAQLASH ✅</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACTION MODAL */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedPC(null); }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#111', width: '100%', padding: '35px 25px', borderRadius: '40px 40px 0 0', borderTop: '1px solid #222' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}><h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900' }}>{selectedPC.name}</h2><button onClick={() => setSelectedPC(null)} style={{ background: '#222', border: 'none', color: '#fff', padding: '12px', borderRadius: '15px' }}><X size={20} /></button></div>
                            {(selectedPC.status === 'busy' || selectedPC.status === 'paused') && (
                                <div style={{ background: '#000', borderRadius: '30px', padding: '30px', textAlign: 'center', marginBottom: '25px', border: '1px solid #222' }}>
                                    <div style={{ fontSize: '45px', fontWeight: '900', color: '#7000ff', fontFamily: 'monospace' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).time}</div>
                                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#39ff14', marginTop: '10px' }}>{calculateSessionInfo(selectedPC, selectedPC.roomPrice).cost?.toLocaleString()} UZS</div>
                                </div>
                            )}
                            {!showReservePicker ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {selectedPC.status === 'free' && (
                                        <><div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                            <button onClick={() => handleAction('start', 30)} style={{ background: '#222', color: '#fff', padding: '20px 0', borderRadius: '20px' }}>30m</button>
                                            <button onClick={() => handleAction('start', 60)} style={{ background: '#222', color: '#fff', padding: '20px 0', borderRadius: '20px' }}>1s</button>
                                            <button onClick={() => handleAction('start', 120)} style={{ background: '#222', color: '#fff', padding: '20px 0', borderRadius: '20px' }}>2s</button>
                                            <button onClick={() => handleAction('start', null)} style={{ background: '#39ff14', color: '#000', padding: '20px 0', borderRadius: '20px', fontWeight: 'bold' }}>GO</button>
                                        </div>
                                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}><input type="number" placeholder="Daqiqa..." value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} style={{ flex: 1.5, background: '#000', border: '1px solid #222', borderRadius: '20px', padding: '15px', color: '#fff', textAlign: 'center' }} /><button onClick={() => handleAction('start', parseInt(customMinutes))} disabled={!customMinutes} style={{ flex: 1, background: '#7000ff', color: '#fff', borderRadius: '20px', fontWeight: 'bold' }}>START</button></div>
                                            <button onClick={() => setShowReservePicker(true)} style={{ gridColumn: 'span 2', padding: '20px', borderRadius: '25px', background: '#ffaa0022', color: '#ffaa00', border: '1px solid #ffaa0044', fontWeight: 'bold' }}>🕒 REZERV QILISH</button></>
                                    )}
                                    {(selectedPC.status === 'busy' || selectedPC.status === 'paused') && (
                                        <><button onClick={() => handleAction('stop')} style={{ background: '#ff444422', border: '1px solid #ff444444', color: '#ff4444', padding: '25px', borderRadius: '25px', fontWeight: 'bold' }}>STOP ⏹️</button>
                                            {selectedPC.status === 'busy' ? <button onClick={() => handleAction('pause')} style={{ background: '#ffee32', color: '#000', padding: '25px', borderRadius: '25px', fontWeight: 'bold' }}>PAUSE ⏸️</button> : <button onClick={() => handleAction('resume')} style={{ background: '#39ff14', color: '#000', padding: '25px', borderRadius: '25px', fontWeight: 'bold' }}>RESUME ▶️</button>}</>
                                    )}
                                    {selectedPC.status === 'reserved' && <button onClick={() => handleAction('cancel_reserve')} style={{ gridColumn: 'span 2', padding: '25px', borderRadius: '25px', background: '#ff4444', color: '#fff', fontWeight: 'bold' }}>BRONNI BEKOR QILISH</button>}
                                </div>
                            ) : (
                                <div style={{ background: '#000', padding: '30px', borderRadius: '35px', border: '1px solid #222' }}>
                                    <h3 style={{ margin: '0 0 20px', textAlign: 'center' }}>REZERV QILISH</h3>
                                    <input placeholder="Ism" value={reserveNameInput} onChange={e => setReserveNameInput(e.target.value)} style={{ width: '100%', padding: '18px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '10px' }} />
                                    <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '18px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: '#fff', marginBottom: '20px', fontSize: '24px', textAlign: 'center' }} />
                                    <div style={{ display: 'flex', gap: '15px' }}><button onClick={() => setShowReservePicker(false)} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: '#222', color: '#fff' }}>BEKOR</button><button onClick={() => handleAction('reserve', null, reserveTimeInput, reserveNameInput)} style={{ flex: 1.5, padding: '18px', borderRadius: '15px', background: '#ff6b6b', color: '#fff', fontWeight: 'bold' }}>REZERV</button></div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>{selectedReceipt && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <img src={`${API_URL}/${selectedReceipt.receiptImage.replace(/\\/g, '/')}`} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '25px' }} />
                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', width: '100%', maxWidth: '400px' }}><button onClick={() => setSelectedReceipt(null)} style={{ flex: 1, padding: '18px', background: '#333', borderRadius: '18px', color: '#fff' }}>YOPISH</button><button onClick={() => { handleApproveTopup(selectedReceipt.id, 'approve'); setSelectedReceipt(null); }} style={{ flex: 1.5, padding: '18px', background: '#39ff14', borderRadius: '18px', color: '#000', fontWeight: 'bold' }}>TASDIQLASH</button></div>
                </motion.div>
            )}</AnimatePresence>
        </div>
    );
};

export default ManagerDashboard;
