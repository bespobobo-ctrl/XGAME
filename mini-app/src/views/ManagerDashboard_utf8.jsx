import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X } from 'lucide-react';

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

    const handleEditRoom = async () => {
        if (!showEditRoom.name) return alert('Xona nomi kerak');
        setActionLoading(true);
        try {
            await callAPI(`/api/manager/room/${showEditRoom.id}`, {
                method: 'PUT',
                body: JSON.stringify(showEditRoom)
            });
            const r = await callAPI('/api/manager/rooms');
            setRooms(r || []);
            setShowEditRoom(null);
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleDeleteRoom = async () => {
        if (!showEditRoom) return;
        if (!window.confirm(`Haqiqatan ham "${showEditRoom.name}" xonasini va undagi barcha PC-larni o'chirib yubormoqchimisiz?`)) return;

        setActionLoading(true);
        try {
            const res = await callAPI(`/api/manager/room/${showEditRoom.id}`, {
                method: 'DELETE'
            });
            if (res.success) {
                const r = await callAPI('/api/manager/rooms');
                setRooms(r || []);
                setShowEditRoom(null);
                alert('Xona o\'chirildi');
            } else {
                alert(res.error || 'Xatolik yuz berdi');
            }
        } catch (e) {
            alert('Xato: ' + e.message);
        }
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
            const r = await callAPI('/api/manager/rooms');
            setRooms(r || []);
            setShowAddRoom(false);
            setNewRoom({ name: '', pricePerHour: 15000, pcCount: 5, pcSpecs: 'M2, RTX 3060' });
        } catch (e) {
            alert('Xato: ' + e.message);
        }
        setActionLoading(false);
    };

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
                const resRooms = await callAPI('/api/manager/rooms');
                const resStats = await callAPI('/api/manager/stats');

                setRooms(Array.isArray(resRooms) ? resRooms : []);
                setStats(resStats && !resStats.error ? resStats : null);

                // ЁЯФД Refresh selectedPC with fresh data to start timer immediately
                if (selectedPC && Array.isArray(resRooms)) {
                    const allPCs = resRooms.flatMap(r => r.Computers);
                    const freshPC = allPCs.find(p => p.id === selectedPC.id);
                    if (freshPC) setSelectedPC(freshPC);
                }

                const now = new Date();
                const defaultTime = new Date(now.getTime() + 60 * 60000); // +1 soat
                const hours = defaultTime.getHours().toString().padStart(2, '0');
                const minutes = defaultTime.getMinutes().toString().padStart(2, '0');
                setReserveNameInput('Mehmon');
                setReservePhoneInput('');
                setReserveTimeInput(`${hours}:${minutes}`);
                setShowReservePicker(false);
            } else {
                alert('Xatolik: ' + (res.error || res.message || 'Noma\'lum xato'));
            }
        } catch (e) {
            alert('Xato: ' + e.message);
        }
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
            alert('Xabar muvaffaqiyatli yuborildi!');
            setBroadcastMessage('');
        } catch (e) {
            alert('Xatolik: ' + e.message);
        }
        setIsBroadcasting(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [s, r] = await Promise.all([
                    callAPI('/api/manager/stats'),
                    callAPI('/api/manager/rooms')
                ]);
                setStats(s && !s.error ? s : null);
                setRooms(Array.isArray(r) ? r : []);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const dataInterval = setInterval(async () => {
            try {
                const [s, r] = await Promise.all([
                    callAPI('/api/manager/stats'),
                    callAPI('/api/manager/rooms')
                ]);
                setStats(s && !s.error ? s : null);
                setRooms(Array.isArray(r) ? r : []);

                // ЁЯФД Real-time selected PC update (Senior UX)
                if (selectedPC && Array.isArray(r)) {
                    const allPCs = r.flatMap(rm => rm.Computers);
                    const freshPC = allPCs.find(p => p.id === selectedPC.id);
                    if (freshPC) setSelectedPC(freshPC);
                }
            } catch (err) { console.error(err); }
        }, 4000); // 4s update (Optimized for performance & real-time)

        const timerInterval = setInterval(() => setNowTime(Date.now()), 1000); // 1s live UI update
        return () => {
            clearInterval(dataInterval);
            clearInterval(timerInterval);
        };
    }, []);

    const renderPC = (pc, room) => {
        const isActive = pc.status === 'busy';
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
            if (pc.status === 'free') return { color: '#39ff14', icon: <Monitor size={28} strokeWidth={1.5} />, label: 'BO\'SH' };
            if (pc.status === 'busy') {
                let dynamicLabel = elapsedTime;
                if (activeSession?.expectedMinutes) {
                    const expectedEndsAt = new Date(new Date(activeSession.startTime).getTime() + activeSession.expectedMinutes * 60000);
                    const now = new Date();
                    if (now >= expectedEndsAt) dynamicLabel = "Vaqti tugadi!";
                }
                return { color: '#ff00ff', icon: <MonitorPlay size={28} strokeWidth={2} />, label: dynamicLabel };
            }
            if (pc.status === 'paused') return { color: '#ffee32', icon: <Clock size={28} strokeWidth={1.5} />, label: `PAUZA (${elapsedTime})` };

            if (pc.status === 'reserved' || (reservation && pc.status !== 'busy')) {
                let reserveLabel = 'BRON';
                if (reservation?.reserveTime) {
                    const rt = new Date(reservation.reserveTime);
                    reserveLabel = `ЁЯХТ ${rt.getHours().toString().padStart(2, '0')}:${rt.getMinutes().toString().padStart(2, '0')}`;
                    if (reservation.guestName) reserveLabel += ` (${reservation.guestName})`;
                }
                return { color: '#ffaa00', icon: <CalendarClock size={28} strokeWidth={1.5} />, label: reserveLabel };
            }
            if (pc.status === 'vip') return { color: '#00ffff', icon: <Crown size={28} strokeWidth={1.5} />, label: 'VIP' };
            return { color: '#444', icon: <PowerOff size={28} strokeWidth={1.5} />, label: 'O\'CHIQ' };
        };
        const { color, icon, label } = getStatusTheme();

        return (
            <motion.div
                key={pc.id}
                whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${color}44` }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setSelectedPC(pc);
                    const now = new Date();
                    const nextHour = new Date(now.getTime() + 60 * 60000);
                    setReserveNameInput('Mehmon');
                    setReserveTimeInput(`${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`);
                    setReservePhoneInput('');
                    setShowReservePicker(false);
                }}
                style={{
                    background: `linear-gradient(145deg, #111, #050505)`,
                    border: `1px solid ${(isActive || pc.status === 'reserved') ? color + '66' : '#222'}`,
                    borderTop: `2px solid ${(isActive || pc.status === 'reserved') ? color : '#333'}`,
                    borderRadius: '20px',
                    padding: '20px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: (isActive || pc.status === 'reserved') ? `0 10px 30px ${color}22` : 'none'
                }}
            >
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: color, width: `${progress}%`, boxShadow: `0 0 15px ${color}` }}
                    />
                )}

                <div style={{ color: color, marginBottom: '10px', filter: `drop-shadow(0 0 8px ${color}66)` }}>
                    {icon}
                </div>

                <span style={{ fontSize: '12px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{pc.name}</span>

                <div style={{ margin: '8px 0 0', fontSize: '13px', fontWeight: 'bold', color: isActive ? color : '#666', background: isActive ? `${color}11` : 'transparent', padding: '4px 10px', borderRadius: '8px' }}>
                    {label}
                </div>
            </motion.div>
        );
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ fontSize: '40px' }}
            >
                тЪб
            </motion.div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', paddingBottom: '100px' }}>

            {/* ЁЯТО PREMIUM HEADER */}
            <header style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>{(stats?.clubName || 'GAME ZONE').toUpperCase()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }}
                        ></motion.div>
                        <span style={{ fontSize: '10px', color: '#888', fontWeight: 'bold' }}>{user.username.toUpperCase()} (ONLINE)</span>
                    </div>
                </div>
                <button onClick={onLogout} style={{ background: 'none', border: '1px solid #ff444433', color: '#ff4444', padding: '8px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>LOGOUT</button>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'stats' && (
                    <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ padding: '20px' }}>

                        {/* ЁЯФФ URGENT RESERVATIONS ALERT */}
                        {stats?.urgentReservations?.length > 0 && (
                            <div style={{ background: 'linear-gradient(90deg, #ffaa00, #ff4444)', padding: '15px', borderRadius: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>ЁЯУЮ</div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', color: '#000', fontWeight: 'bold' }}>DIQQAT: BRON VAQTI YAQINLASHDI!</h4>
                                    {stats.urgentReservations.map((ur, i) => (
                                        <p key={i} style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(0,0,0,0.8)' }}>
                                            <b>{ur.pc}</b> - {ur.user} ({ur.phone || 'Tel topilmadi'}). Telefon qilib ogohlantiring!
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(() => {
                            let liveTotalDay = stats?.revenue?.day || 0;
                            let isTicking = false;
                            stats?.pcStats?.forEach(p => {
                                if (p.activeSessionStart) {
                                    isTicking = true;
                                    const room = rooms.find(r => String(r.id) === String(p.roomId));
                                    const now = new Date(nowTime);
                                    const fetch = new Date(stats?.fetchTime || nowTime);
                                    const deltaMs = Math.max(0, now.getTime() - fetch.getTime());
                                    const pph = room?.pricePerHour || p.pricePerHour || 15000;
                                    liveTotalDay += (deltaMs / 3600000) * pph;
                                }
                            });

                            return (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '20px' }}>
                                    <div style={{ background: '#111', padding: '12px 8px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                        {isTicking && <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: '5px', right: '5px', width: '4px', height: '4px', background: '#39ff14', borderRadius: '50%' }} />}
                                        <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>DAROMAD</p>
                                        <h3 style={{ margin: '3px 0 0', fontSize: '15px', color: '#39ff14', fontWeight: '900' }}>{Math.round(liveTotalDay).toLocaleString()}</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '12px 8px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>JAMI</p>
                                        <h3 style={{ margin: '3px 0 0', fontSize: '14px', color: '#fff' }}>{stats?.totalPCs} ta</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '12px 8px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>BAND</p>
                                        <h3 style={{ margin: '3px 0 0', fontSize: '14px', color: '#ff4444' }}>{stats?.busyPCs} ta</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '12px 8px', borderRadius: '15px', border: '1px solid #ffaa0044', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '9px', color: '#ffaa00' }}>BRON</p>
                                        <h3 style={{ margin: '3px 0 0', fontSize: '14px', color: '#ffaa00' }}>{stats?.reservedPCs || 0} ta</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '12px 8px', borderRadius: '15px', border: '1px solid #222', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>BO'SH</p>
                                        <h3 style={{ margin: '3px 0 0', fontSize: '14px', color: '#7000ff' }}>{stats?.freePCs} ta</h3>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ЁЯУЕ KUTILAYOTGAN BRONLAR */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #ffaa0033' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '10px', color: '#ffaa00', letterSpacing: '1px' }}>ЁЯУЕ REZERV QILINGANLAR ({stats?.reservedPCs || 0})</h4>
                            {stats?.upcomingReservations?.length > 0 ? (
                                stats.upcomingReservations.map((res, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0a0a0a', borderRadius: '15px', marginBottom: '8px', border: '1px solid #222' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>[{res.room}] {res.pc}</div>
                                            <div style={{ fontSize: '10px', color: '#888' }}>MIJOZ: {res.user}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '13px', color: '#ffaa00', fontWeight: 'bold' }}>{new Date(res.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))
                            ) : <p style={{ margin: 0, fontSize: '12px', color: '#444', textAlign: 'center' }}>Bronlar yo'q</p>}
                        </div>

                        {/* ЁЯФ┤ BAND KO'RINKI HLORDA */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #ff444433' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '10px', color: '#ff4444', letterSpacing: '1px' }}>ЁЯФ┤ HOZIR BAND PC-LAR ({stats?.busyPCs || 0})</h4>
                            {rooms.flatMap(r => r.Computers).filter(c => c.status === 'busy').length > 0 ? (
                                rooms.flatMap(r => r.Computers).filter(c => c.status === 'busy').map((pc, i) => {
                                    const room = rooms.find(rm => rm.id === pc.RoomId);
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#0a0a0a', borderRadius: '15px', marginBottom: '8px', border: '1px solid #222' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>[{room?.name}] {pc.name}</div>
                                            <div style={{ fontSize: '12px', color: '#ff4444' }}>O'YINDA ЁЯОо</div>
                                        </div>
                                    );
                                })
                            ) : <p style={{ margin: 0, fontSize: '12px', color: '#444', textAlign: 'center' }}>Bandlar yo'q</p>}
                        </div>

                        {/* ЁЯПЖ PC REYTINGI */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px', border: '1px solid #222' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '10px', color: '#888' }}>ЁЯУК PC REYTINGI (BUGUN)</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {stats?.pcStats?.map((pc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontSize: '13px' }}>{pc.name}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            <b style={{ fontSize: '12px', color: '#39ff14' }}>{pc.hours.toFixed(1)} s</b>
                                            <div style={{ fontSize: '10px', color: '#888' }}>{pc.revenue.toLocaleString()} u</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ЁЯСд OXIRGI TASHRIF */}
                        <div style={{ background: 'linear-gradient(135deg, #1a1a24, #0a0a0c)', padding: '20px', borderRadius: '25px', marginBottom: '20px', border: '1px solid rgba(112,0,255,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '12px', color: '#7000ff', letterSpacing: '1px' }}>тП▒я╕П OXIRGI TASHRIFLAR</h4>
                                <div style={{ fontSize: '10px', color: '#444' }}>TOP-5</div>
                            </div>
                            {stats?.recentSessions?.length > 0 ? (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {stats.recentSessions.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>ЁЯСд</div>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{s.user}</div>
                                                    <div style={{ fontSize: '10px', color: '#666' }}>{s.pc} тАв {s.duration} daqiqa</div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', color: '#39ff14', fontWeight: 'bold' }}>+{s.cost?.toLocaleString()}</div>
                                                <div style={{ fontSize: '9px', color: '#444' }}>{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ margin: 0, fontSize: '12px', color: '#666', textAlign: 'center', padding: '10px' }}>Hali tashriflar yo'q</p>}
                        </div>

                        {/* ЁЯУИ KUNLIK BATAFSIL (PC HOURS & REVENUE) */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#fff' }}>ЁЯЦея╕П KUNLIK PC ISHLASH VAQTLARI</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {stats?.pcStats?.map((pc, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontSize: '13px' }}>{pc.name}</div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#39ff14' }}>{pc.hours.toFixed(1)} soat</div>
                                            <div style={{ fontSize: '10px', color: '#888' }}>{pc.revenue.toLocaleString()} UZS</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ЁЯМЯ YANGILIK/XABAR YUBORISH */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#ffaa00' }}>ЁЯУг OMMAVIY XABAR BARCHA UCHUN</h4>
                            <textarea
                                value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)}
                                placeholder="Barcha ruyxatdan o'tgan mijozlarga bot orqali xabar yuborish..."
                                style={{ width: '100%', height: '80px', background: '#000', border: '1px solid #333', borderRadius: '15px', color: '#fff', padding: '10px', fontSize: '12px', resize: 'none', marginBottom: '10px', outline: 'none' }}
                            />
                            <button onClick={handleBroadcast} disabled={isBroadcasting} style={{ width: '100%', padding: '12px', background: isBroadcasting ? '#444' : '#ffaa00', color: '#000', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: isBroadcasting ? 'not-allowed' : 'pointer' }}>
                                {isBroadcasting ? "YUBORILMOQDA..." : "XABARNI YUBORISH ЁЯЪА"}
                            </button>
                        </div>

                        {/* ЁЯПЖ TOP-3 KOMPYUTERLAR */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#39ff14' }}>ЁЯПЖ ENG KO'P ISHLAGAN TOP-3 PC</h4>
                            {stats?.topPCs?.map((pc, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#1a1a1a', borderRadius: '12px', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>#{i + 1} {pc.name}</div>
                                    <div style={{ fontSize: '14px', color: '#39ff14' }}>{pc.hours.toFixed(1)} soat</div>
                                </div>
                            ))}
                        </div>

                        {/* ЁЯУК OYLIK HAFTALIK YILLIK (DAROMAD, SOAT, OQIM) */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {['day', 'week', 'month', 'year'].map(period => (
                                <div key={period} style={{ background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '20px' }}>
                                    <h5 style={{ margin: '0 0 10px', fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>{period === 'day' ? 'Bugun' : period === 'week' ? 'Shu Hafta' : period === 'month' ? 'Shu Oy' : 'Shu Yil'}</h5>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <div><span style={{ color: '#888' }}>Oqim:</span> <b style={{ color: '#fff' }}>{stats?.flow?.[period] || 0}</b></div>
                                        <div><span style={{ color: '#888' }}>Soat:</span> <b style={{ color: '#39ff14' }}>{stats?.hours?.[period]?.toFixed(1) || 0}</b></div>
                                        <div><span style={{ color: '#888' }}>Daromad:</span> <b style={{ color: '#7000ff' }}>{stats?.revenue?.[period]?.toLocaleString() || 0}</b></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms-list" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ padding: '20px' }}>

                        <div style={{ margin: '0 0 20px', padding: '20px', background: 'linear-gradient(45deg, #111, #000)', borderRadius: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #7000ff33' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', margin: 0, color: '#fff', letterSpacing: '2px' }}>KLUB XARITASI ЁЯЧ║я╕П</h2>
                                <p style={{ fontSize: '10px', color: '#888', margin: '5px 0 0' }}>Jami xonalar: {rooms.length} ta</p>
                            </div>
                            <button onClick={() => setShowAddRoom(true)} style={{ background: '#7000ff', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 0 15px rgba(112,0,255,0.4)', cursor: 'pointer' }}>
                                + YANGI XONA
                            </button>
                        </div>

                        {Array.isArray(rooms) && rooms.map((room, index) => {
                            let roomRevenue = 0;
                            let roomHours = 0;
                            stats?.pcStats?.forEach(p => {
                                if (String(p.roomId) === String(room.id)) {
                                    let curR = p.revenue;
                                    let curH = p.hours;
                                    if (p.activeSessionStart) {
                                        const now = new Date(nowTime);
                                        const fetch = new Date(stats?.fetchTime || nowTime);
                                        const deltaMs = Math.max(0, now.getTime() - fetch.getTime());
                                        const pph = room.pricePerHour || p.pricePerHour || 15000;
                                        curR += (deltaMs / 3600000) * pph;
                                        curH += (deltaMs / 3600000);
                                    }
                                    roomRevenue += curR;
                                    roomHours += curH;
                                }
                            });
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    key={room.id}
                                    style={{ marginBottom: '20px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)', borderRadius: '30px', padding: '15px 20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '15px', cursor: 'pointer' }}
                                    whileHover={{ scale: 1.01, border: '1px solid rgba(112,0,255,0.5)' }}
                                    onClick={() => setSelectedViewRoom(room)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'linear-gradient(135deg, #7000ff, #39ff14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', margin: 0, boxShadow: '0 0 15px rgba(112,0,255,0.3)', color: '#fff' }}>
                                                {room.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{room.name.toUpperCase()}</h3>
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '10px', background: '#222', padding: '3px 6px', borderRadius: '6px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '3px' }}><Monitor size={10} /> {room.Computers?.length} PC</span>
                                                    <span style={{ fontSize: '10px', background: 'rgba(255,0,255,0.1)', color: '#ff00ff', padding: '3px 6px', borderRadius: '6px', border: '1px solid rgba(255,0,255,0.2)', display: 'flex', alignItems: 'center', gap: '3px' }}><MonitorPlay size={10} /> BANT: {room.Computers?.filter(c => c.status === 'busy').length}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowEditRoom(room); }}
                                            style={{ background: '#222', border: 'none', color: '#fff', padding: '8px', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Pencil size={16} color="#888" />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#080808', padding: '12px 15px', borderRadius: '18px', border: '1px solid #1a1a1a' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>IsH VAQTI (Bugun)</div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#39ff14' }}>{roomHours.toFixed(1)} SOAT</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>DAROMAD (Bugun)</div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ffff' }}>{Math.round(roomRevenue).toLocaleString()} UZS</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} color="#7000ff" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} style={{ padding: '20px' }}>

                        <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => {
                                setSelectedViewRoom(null);
                                // optional: refresh rooms dynamically
                                callAPI('/api/manager/rooms').then(r => setRooms(r || []));
                            }} style={{ width: '45px', height: '45px', borderRadius: '15px', background: '#111', border: '1px solid #333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 style={{ fontSize: '24px', margin: 0, color: '#fff', letterSpacing: '1px' }}>{selectedViewRoom.name.toUpperCase()}</h2>
                                <p style={{ fontSize: '12px', color: '#00ffff', margin: '4px 0 0' }}>{selectedViewRoom.pricePerHour.toLocaleString()} UZS / SOATIGA</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                            {/* ensure to find the latest computers from state just in case */}
                            {(rooms.find(r => r.id === selectedViewRoom.id)?.Computers || selectedViewRoom.Computers)?.map(pc => renderPC(pc, selectedViewRoom))}
                        </div>

                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '30px', borderRadius: '40px', display: 'grid', gap: '20px' }}>
                            <h4 style={{ margin: 0, fontSize: '12px', color: '#7000ff', letterSpacing: '2px' }}>CLUB CONFIG</h4>

                            <div style={{ padding: '15px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#888' }}>Auto-Lock PC</span>
                                <b style={{ color: '#39ff14' }}>ENABLED</b>
                            </div>

                            <div style={{ padding: '15px 0', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', color: '#888' }}>Language</span>
                                <b>UZBEK ЁЯЗ║ЁЯЗ┐</b>
                            </div>

                            <button
                                onClick={() => setActiveTab('stats')}
                                style={{ marginTop: '20px', background: '#fff', color: '#000', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 'bold' }}>
                                SAVE CHANGES
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PC ACTION MODAL */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 999, display: 'flex', alignItems: 'flex-end', overflowY: 'auto' }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setSelectedPC(null); setShowReservePicker(false); } }}
                    >
                        {(() => {
                            let currentCost = 0;
                            let modalElapsedTime = '00:00:00';
                            let satAtTime = '--:--';
                            let expectedDuration = 'Cheksiz';
                            let endsAtTime = '--:--';

                            const activeSession = selectedPC.Sessions?.find(s => s.status === 'active' || (s.status === 'paused' && !s.reserveTime));
                            const reservation = selectedPC.Sessions?.find(s => s.status === 'paused' && s.reserveTime);
                            const price = rooms.find(r => r.id === selectedPC.RoomId)?.pricePerHour || 15000;
                            const pcPerformance = stats?.pcStats?.find(p => p.name === selectedPC.name);

                            if (selectedPC.status === 'busy' || selectedPC.status === 'paused') {
                                if (activeSession) {
                                    const start = new Date(activeSession.startTime);
                                    satAtTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;

                                    if (activeSession.expectedMinutes) {
                                        expectedDuration = activeSession.expectedMinutes >= 60 ? `${activeSession.expectedMinutes / 60} Soat` : `${activeSession.expectedMinutes} Daqiqa`;
                                        const end = new Date(start.getTime() + activeSession.expectedMinutes * 60000);
                                        endsAtTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                                    }

                                    const effectiveNow = selectedPC.status === 'paused' ? new Date(activeSession.pausedAt) : nowTime;
                                    const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
                                    const h = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
                                    const m = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
                                    const s = (diffSeconds % 60).toString().padStart(2, '0');
                                    modalElapsedTime = `${h}:${m}:${s}`;
                                    currentCost = Math.floor((diffSeconds / 3600) * price);
                                }
                            }

                            return (
                                <motion.div
                                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                                    style={{ background: 'linear-gradient(180deg, #16161a 0%, #0a0a0c 100%)', width: '100%', padding: '30px', borderRadius: '40px 40px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 -20px 50px rgba(0,0,0,0.8)', minHeight: '60vh' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                        <div>
                                            <h2 style={{ fontSize: '32px', margin: '0 0 5px', color: '#fff', fontWeight: '900', letterSpacing: '1px' }}>{selectedPC.name}</h2>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedPC.status === 'busy' ? '#ff0844' : selectedPC.status === 'paused' ? '#ffee32' : selectedPC.status === 'vip' ? '#b224ef' : '#39ff14', boxShadow: `0 0 10px ${selectedPC.status === 'busy' ? '#ff0844' : selectedPC.status === 'paused' ? '#ffee32' : selectedPC.status === 'vip' ? '#b224ef' : '#39ff14'}` }}></div>
                                                <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '900', letterSpacing: '2px' }}>{selectedPC.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: '900', fontFamily: 'monospace' }}>{new Date(nowTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div style={{ color: '#39ff14', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>LIVE TIME</div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedPC(null); setShowReservePicker(false); }}
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* PC INFO HUD BAGDES */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#666', fontSize: '9px', fontWeight: 'bold' }}>BUGUN ISHLADI</div>
                                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{pcPerformance?.hours?.toFixed(1) || 0} soat</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ color: '#666', fontSize: '9px', fontWeight: 'bold' }}>BUGUN TOPDI</div>
                                            <div style={{ color: '#39ff14', fontSize: '14px', fontWeight: 'bold' }}>{pcPerformance?.revenue?.toLocaleString() || 0} UZS</div>
                                        </div>
                                    </div>

                                    {(selectedPC.status === 'busy' || selectedPC.status === 'paused') && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ color: '#666', fontSize: '10px', fontWeight: 'bold' }}>O'TIRDI</div>
                                                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{satAtTime}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ color: '#666', fontSize: '10px', fontWeight: 'bold' }}>OLINGAN</div>
                                                    <div style={{ color: '#00f2fe', fontSize: '16px', fontWeight: 'bold' }}>{expectedDuration}</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ color: '#666', fontSize: '10px', fontWeight: 'bold' }}>YAKUNLASH</div>
                                                    <div style={{ color: '#ffb199', fontSize: '16px', fontWeight: 'bold' }}>{endsAtTime}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                                                <div style={{ flex: 1, background: 'rgba(255, 8, 68, 0.1)', border: '1px solid rgba(255, 8, 68, 0.3)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
                                                    <div style={{ color: '#ff0844', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>{selectedPC.status === 'paused' ? "TO'XTAGAN VAQT" : "VAQT O'TDI"}</div>
                                                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: '900', fontFamily: 'monospace' }}>{modalElapsedTime}</div>
                                                </div>
                                                <div style={{ flex: 1, background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
                                                    <div style={{ color: '#39ff14', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>HISOB (UZS)</div>
                                                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: '900' }}>{currentCost.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {!showReservePicker ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {/* Free or Reserved PC controls */}
                                            {(selectedPC.status !== 'busy' && selectedPC.status !== 'paused') && (
                                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                        <button onClick={() => handleAction('start', 30)} disabled={actionLoading} style={{ background: '#111', color: '#39ff14', border: '1px solid #39ff1433', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>30M</button>
                                                        <button onClick={() => handleAction('start', 60)} disabled={actionLoading} style={{ background: '#111', color: '#39ff14', border: '1px solid #39ff1433', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>1S</button>
                                                        <button onClick={() => handleAction('start', 120)} disabled={actionLoading} style={{ background: '#111', color: '#39ff14', border: '1px solid #39ff1433', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>2S</button>
                                                        <button onClick={() => handleAction('start', null)} disabled={actionLoading} style={{ background: 'linear-gradient(45deg, #39ff14, #00ffcc)', color: '#000', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold' }}>GO</button>
                                                    </div>

                                                    {selectedPC.status === 'reserved' || reservation ? (
                                                        <button
                                                            onClick={() => handleAction('cancel_reserve')}
                                                            style={{
                                                                width: '100%', padding: '18px', borderRadius: '20px',
                                                                background: '#ff4444', color: '#fff', border: 'none',
                                                                fontWeight: 'bold', display: 'flex', alignItems: 'center',
                                                                justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(255, 68, 68, 0.2)'
                                                            }}
                                                        >
                                                            <Trash2 size={20} /> BRONNI BEKOR QILISH тЭМ
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowReservePicker(true)}
                                                            style={{
                                                                width: '100%', padding: '18px', borderRadius: '20px',
                                                                background: '#ffaa00', color: '#000', border: 'none',
                                                                fontWeight: 'bold', display: 'flex', alignItems: 'center',
                                                                justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(253, 160, 133, 0.2)'
                                                            }}
                                                        >
                                                            <CalendarClock size={20} /> BRON QILISH (RESERVE) ЁЯХТ
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Active PC controls (Stop/Pause) */}
                                            {(selectedPC.status === 'busy' || selectedPC.status === 'paused') && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction('stop')} disabled={actionLoading}
                                                        style={{ background: '#000', color: '#ff4444', padding: '20px', borderRadius: '24px', border: '1px solid #ff444433', fontWeight: 'bold', gridColumn: 'span 1' }}
                                                    >
                                                        STOP тП╣я╕П
                                                    </button>

                                                    {selectedPC.status === 'busy' ? (
                                                        <button
                                                            onClick={() => handleAction('pause')} disabled={actionLoading}
                                                            style={{ background: '#ffee32', color: '#000', padding: '20px', borderRadius: '24px', border: 'none', fontWeight: 'bold', gridColumn: 'span 1' }}
                                                        >
                                                            PAUSE тП╕я╕П
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAction('resume')} disabled={actionLoading}
                                                            style={{ background: '#39ff14', color: '#000', padding: '20px', borderRadius: '24px', border: 'none', fontWeight: 'bold', gridColumn: 'span 1' }}
                                                        >
                                                            RESUME тЦ╢я╕П
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {selectedPC.status !== 'busy' && selectedPC.status !== 'paused' && (
                                                <button
                                                    onClick={() => handleAction('vip')} disabled={actionLoading}
                                                    style={{ background: 'linear-gradient(135deg, #b224ef 0%, #7579ff 100%)', color: '#fff', padding: '20px', borderRadius: '24px', border: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(117, 121, 255, 0.3)', cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                                                >
                                                    <Diamond size={28} fill="#fff" strokeWidth={1} />
                                                    <span>VIP REJIM</span>
                                                </button>
                                            )}

                                            {(selectedPC.status === 'free' || selectedPC.status === 'vip') && (
                                                <button
                                                    onClick={() => handleAction('lock')} disabled={actionLoading}
                                                    style={{ background: '#222', color: '#ff4444', padding: '20px', borderRadius: '24px', border: '1px solid #444', fontWeight: 'bold', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                                                >
                                                    <Lock size={28} strokeWidth={2} />
                                                    <span>BAND QILISH</span>
                                                </button>
                                            )}

                                            {selectedPC.status === 'busy' && (
                                                <button
                                                    onClick={() => handleAction('free')} disabled={actionLoading}
                                                    style={{ background: '#222', color: '#39ff14', padding: '20px', borderRadius: '24px', border: '1px solid #444', fontWeight: 'bold', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: actionLoading ? 0.6 : 1, gridColumn: 'span 2' }}
                                                >
                                                    <Monitor size={28} strokeWidth={1} />
                                                    <span>KOMPYUTERNI TOZALASH (FREE)</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '18px', textAlign: 'center' }}>Bron qilish:</h3>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '5px' }}>MIJOZ ISMI:</label>
                                                <input placeholder="Masalan: Azizbek..." value={reserveNameInput} onChange={e => setReserveNameInput(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #333', color: '#fff' }} />
                                            </div>

                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '5px' }}>TEL RAQAMI (IXTIYORIY):</label>
                                                <input placeholder="+998 90..." value={reservePhoneInput} onChange={e => setReservePhoneInput(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #333', color: '#fff' }} />
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '5px' }}>BRON VAQTI (Majburiy):</label>
                                                <input type="time" value={reserveTimeInput} onChange={e => setReserveTimeInput(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #333', color: '#fff', fontSize: '24px', textAlign: 'center', fontWeight: 'bold' }} />
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => setShowReservePicker(false)} style={{ flex: 1, padding: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>BEKOR</button>
                                                <button
                                                    onClick={() => handleAction('reserve', null, reserveTimeInput, reserveNameInput, reservePhoneInput)}
                                                    disabled={actionLoading || !reserveTimeInput}
                                                    style={{ flex: 1, padding: '15px', background: 'linear-gradient(45deg, #f6d365, #fda085)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', opacity: (!reserveTimeInput || actionLoading) ? 0.3 : 1 }}
                                                >
                                                    SAQLASH
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD ROOM MODAL */}
            <AnimatePresence>
                {showAddRoom && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            style={{ background: '#111', width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '30px', border: '1px solid #333' }}
                        >
                            <h2 style={{ fontSize: '20px', margin: '0 0 20px', color: '#fff', textAlign: 'center' }}>+ YANGI XONA ЁЯОо</h2>

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Xona nomi (Masalan: VIP Xona):</label>
                            <input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Soatiga narxi (UZS):</label>
                            <input type="number" value={newRoom.pricePerHour} onChange={e => setNewRoom({ ...newRoom, pricePerHour: parseInt(e.target.value) })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>Nechta PC joylashgan:</label>
                            <input type="number" value={newRoom.pcCount} onChange={e => setNewRoom({ ...newRoom, pcCount: parseInt(e.target.value) })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '15px' }} />

                            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' }}>PC parametrlari (Qisqacha):</label>
                            <input value={newRoom.pcSpecs} onChange={e => setNewRoom({ ...newRoom, pcSpecs: e.target.value })} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '15px', marginBottom: '25px' }} />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowAddRoom(false)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>BEKOR QILISH</button>
                                <button onClick={handleAddRoom} disabled={actionLoading} style={{ flex: 1, padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>+{actionLoading ? '...' : 'QO\'SHISH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT ROOM MODAL */}
            <AnimatePresence>
                {showEditRoom && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            style={{ background: '#111', width: '100%', maxWidth: '400px', padding: '25px', borderRadius: '30px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '18px', margin: 0, color: '#fff' }}>тЪЩя╕П XONANI SOZLASH</h2>
                                <button onClick={handleDeleteRoom} style={{ background: '#ff444422', border: 'none', color: '#ff4444', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>XONA NOMI</label>
                            <input value={showEditRoom.name} onChange={e => setShowEditRoom({ ...showEditRoom, name: e.target.value })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', marginBottom: '15px', fontSize: '14px' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>SOATIGA (UZS)</label>
                                    <input type="number" value={showEditRoom.pricePerHour} onChange={e => setShowEditRoom({ ...showEditRoom, pricePerHour: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '14px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>PC SONI</label>
                                    <input type="number" value={showEditRoom.pcCount} onChange={e => setShowEditRoom({ ...showEditRoom, pcCount: parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff', borderRadius: '12px', fontSize: '14px' }} />
                                </div>
                            </div>

                            <div style={{ background: '#080808', padding: '15px', borderRadius: '20px', border: '1px solid #1a1a1a', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Lock size={14} color={showEditRoom.isLocked ? '#ff4444' : '#666'} />
                                        <span style={{ fontSize: '12px', color: '#fff' }}>Vaqt bo'yicha qulflash</span>
                                    </div>
                                    <input type="checkbox" checked={showEditRoom.isLocked} onChange={e => setShowEditRoom({ ...showEditRoom, isLocked: e.target.checked })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', marginBottom: '3px', display: 'block' }}>OCHILISH</label>
                                        <input type="time" value={showEditRoom.openTime} onChange={e => setShowEditRoom({ ...showEditRoom, openTime: e.target.value })} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10px', color: '#666', marginBottom: '3px', display: 'block' }}>YOPILISH</label>
                                        <input type="time" value={showEditRoom.closeTime} onChange={e => setShowEditRoom({ ...showEditRoom, closeTime: e.target.value })} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '8px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowEditRoom(null)} style={{ flex: 1, padding: '15px', background: '#222', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>BEKOR</button>
                                <button onClick={handleEditRoom} disabled={actionLoading} style={{ flex: 1, padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px' }}>{actionLoading ? '...' : 'SAQLASH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ЁЯзн PREMIUM BOTTOM NAV */}
            {/* Shared Nav handled by App.jsx */}
        </div>
    );
};

export default ManagerDashboard;
