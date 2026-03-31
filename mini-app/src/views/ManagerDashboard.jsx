import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';
import { Monitor, MonitorPlay, CalendarClock, ArrowLeft, Pencil, Trash2, Clock, Play, X, User as UserIcon, Plus, LayoutGrid, Users, Wallet, Search, Timer, AlertTriangle, BellRing, ChevronRight } from 'lucide-react';

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

    const [usersList, setUsersList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [s, r, u] = await Promise.all([
                callAPI(`/api/manager/stats?t=${timestamp}`),
                callAPI(`/api/manager/rooms?t=${timestamp}`),
                activeTab === 'users' ? callAPI(`/api/manager/users?q=${searchQuery || ''}&t=${timestamp}`) : Promise.resolve([])
            ]);

            if (s && !s.error) setStats(s);
            if (Array.isArray(r)) setRooms(r);
            if (activeTab === 'users' && Array.isArray(u)) setUsersList(u);

            // Sync selected PC to get fresh session data
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
            // BACKUP SEARCH in GLOBAL Reservations with robustness
            const globalRes = stats?.upcomingReservations?.find(r => (r.pc || '').trim().toUpperCase() === pcNameNormalized);

            const rTimeStr = formatTashkentTime(globalRes?.time || activeSession.reserveTime);
            let reserveUser = globalRes?.user || activeSession.User?.username || activeSession.guestName;

            // Final fallback to user object if still blank
            if (!reserveUser || reserveUser === 'Mehmon') {
                reserveUser = activeSession.User?.username || activeSession.User?.firstName || activeSession.guestName || 'Mijoz';
            }

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
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
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
                setShowAddRoomModal(false); setEditingRoom(null);
                setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' });
                fetchData();
            } else alert(res.error || "Xatolik!");
        } catch (e) { alert("Server xatosi!"); }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
        try {
            const res = await callAPI(`/api/manager/room/${id}`, { method: 'DELETE' });
            if (res.success) fetchData();
            else alert(res.error || "Xatolik!");
        } catch (e) { alert("Server xatosi!"); }
    };

    const renderPC = (pc, room) => {
        const s = (pc?.status || 'free').toLowerCase();
        const isActive = s === 'busy' || s === 'paused';
        const isReserved = s === 'reserved';
        const info = calculateSessionInfo(pc, room?.pricePerHour || 15000);

        const theme = s === 'busy' ? { color: info.isCountdown ? '#39ff14' : '#ff00ff', icon: <MonitorPlay size={20} />, label: info.time } :
            s === 'paused' ? { color: '#ffee32', icon: <Clock size={20} />, label: 'PAUZA' } :
                isReserved ? { color: '#ffaa00', icon: <CalendarClock size={20} />, label: info.reservedInfo?.time || 'BRON' } :
                    { color: '#444', icon: <Monitor size={20} />, label: 'BO\'SH' };

        return (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPC({ ...pc, roomPrice: room?.pricePerHour || 15000 })} style={{ background: '#0a0a0a', border: `1.5px solid ${isActive || isReserved ? theme.color : '#1a1a1a'}`, borderRadius: '22px', padding: '15px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ color: theme.color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>{theme.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}>{pc.name}</div>
                <div style={{ fontSize: '8px', color: (isActive || isReserved) ? theme.color : '#333', marginTop: '2px' }}>{theme.label}</div>
            </motion.div>
        );
    };

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
                        <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>BUGUNGI BRONLAR</h3>
                        {stats?.upcomingReservations?.map((res, i) => (
                            <div key={i} style={{ background: '#111', padding: '18px', borderRadius: '30px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><h4 style={{ margin: 0, fontSize: '16px' }}>{res.pc} • {res.user}</h4><p style={{ fontSize: '10px', color: '#444' }}>Vaqt: {formatTashkentTime(res.time)}</p></div>
                                {res.isUrgent && <AlertTriangle color="#ffaa00" size={16} />}
                            </div>
                        ))}
                        {(!stats?.upcomingReservations || stats.upcomingReservations.length === 0) && <div style={{ textAlign: 'center', padding: '20px', color: '#333' }}>Bronlar yo'q</div>}
                    </motion.div>
                )}

                {activeTab === 'rooms' && !selectedViewRoom && (
                    <motion.div key="rooms" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '950' }}>XONALAR</h2>
                            <button onClick={() => { setEditingRoom(null); setNewRoomData({ name: '', pricePerHour: '', pcCount: '', specs: '' }); setShowAddRoomModal(true); }} style={{ background: '#7000ff', border: 'none', color: '#fff', padding: '12px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}><Plus size={16} /> QO'SHISH</button>
                        </div>
                        {rooms.map(room => (
                            <div key={room.id} style={{ background: '#111', borderRadius: '35px', padding: '25px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div onClick={() => setSelectedViewRoom(room)} style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '950' }}>{room.name?.toUpperCase()}</h3>
                                    <p style={{ fontSize: '11px', color: '#444' }}>{room.Computers?.length} PC • {room.pricePerHour} UZS</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => { setEditingRoom(room); setNewRoomData({ name: room.name, pricePerHour: room.pricePerHour, pcCount: room.pcCount, specs: room.Computers?.[0]?.specs || '' }); setShowAddRoomModal(true); }} style={{ background: '#222', padding: '10px', borderRadius: '15px', border: 'none', color: '#fff' }}><Pencil size={18} /></button>
                                    <button onClick={() => handleDeleteRoom(room.id)} style={{ background: '#ff444420', padding: '10px', borderRadius: '15px', color: '#ff4444', border: 'none' }}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'rooms' && selectedViewRoom && (
                    <motion.div key="room-detail" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#111', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '15px' }}><ArrowLeft /></button>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '950' }}>{currentRoomFromState?.name?.toUpperCase()}</h2>
                        </div>
                        {roomReservations.length > 0 && roomReservations.map((res, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.98 }} onClick={() => setSelectedPC({ ...res.pc, roomPrice: currentRoomFromState.pricePerHour })} style={{ background: '#ffaa0020', borderLeft: '4px solid #ffaa00', padding: '15px 20px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <div><p style={{ fontWeight: '950', color: '#ffaa00', margin: 0 }}>{res.pc.name} BRON!</p><p style={{ fontSize: '11px', margin: 0, color: '#fff' }}>{res.info.time} • {res.info.user}</p></div>
                                <ChevronRight color="#ffaa00" />
                            </motion.div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                            {currentRoomFromState?.Computers?.map(pc => renderPC(pc, currentRoomFromState))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ADD/EDIT ROOM MODAL */}
            <AnimatePresence>
                {showAddRoomModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddRoomModal(false)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px', borderRadius: '45px 45px 0 0', borderTop: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontWeight: '950' }}>{editingRoom ? 'TAHRIRLASH' : 'YANGI XONA'}</h2>
                            <div style={{ display: 'grid', gap: '15px', marginTop: '25px' }}>
                                <input placeholder="Xona nomi" value={newRoomData.name} onChange={e => setNewRoomData({ ...newRoomData, name: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #222', borderRadius: '25px', color: '#fff' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input type="number" placeholder="Narxi" value={newRoomData.pricePerHour} onChange={e => setNewRoomData({ ...newRoomData, pricePerHour: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #222', borderRadius: '25px', color: '#fff' }} />
                                    {!editingRoom && <input type="number" placeholder="PC soni" value={newRoomData.pcCount} onChange={e => setNewRoomData({ ...newRoomData, pcCount: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #222', borderRadius: '25px', color: '#fff' }} />}
                                </div>
                                <textarea placeholder="Specs" value={newRoomData.specs} onChange={e => setNewRoomData({ ...newRoomData, specs: e.target.value })} style={{ padding: '22px', background: '#000', border: '1px solid #222', borderRadius: '25px', color: '#fff', height: '100px' }} />
                                <button onClick={handleAddRoom} style={{ padding: '22px', background: '#39ff14', color: '#000', border: 'none', borderRadius: '25px', fontWeight: '950', fontSize: '16px', marginTop: '10px' }}>{editingRoom ? 'SAQLASH' : 'YARATISH'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PC CONTROL MODAL */}
            <AnimatePresence>
                {selectedPC && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelectedPC(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ background: '#111', width: '100%', padding: '40px 25px 50px', borderRadius: '50px 50px 0 0', borderTop: '1px solid #222' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px', alignItems: 'center' }}>
                                <div><h1 style={{ margin: 0, fontSize: '36px', fontWeight: '950' }}>{selectedPC.name}</h1><p style={{ color: '#444', fontSize: '11px', margin: '4px 0 0' }}>{selectedPC.specs || "Xususiyati kiritilmagan"}</p></div>
                                <button onClick={() => setSelectedPC(null)} style={{ background: '#1a1a1a', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '18px' }}><X /></button>
                            </div>

                            {(() => {
                                const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice);
                                if (selectedPC.status === 'reserved') {
                                    return (
                                        <div style={{ background: '#ffaa0015', border: '1.5px solid #ffaa0030', padding: '25px', borderRadius: '35px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                            <div style={{ background: '#ffaa00', padding: '18px', borderRadius: '22px' }}><UserIcon color="#000" size={32} /></div>
                                            <div><p style={{ color: '#ffaa00', fontSize: '11px', fontWeight: 'bold', margin: '0 0 4px', letterSpacing: '1px' }}>BRONNI KIM QILDI?</p><h3 style={{ fontSize: '28px', margin: 0, fontWeight: '950' }}>{info.reservedInfo?.user}</h3><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}><Clock size={16} color="#ffaa00" /><b style={{ fontSize: '20px' }}>{info.reservedInfo?.time}</b></div></div>
                                        </div>
                                    );
                                } else if (selectedPC.status !== 'free') {
                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                            <div style={{ background: '#000', padding: '25px', borderRadius: '35px', textAlign: 'center', border: '1px solid #111' }}><p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', margin: '0 0 5px' }}>QOLGAN VAQT</p><h3 style={{ color: '#39ff14', fontSize: '28px', margin: 0, fontWeight: '950' }}>{info.time}</h3></div>
                                            <div style={{ background: '#000', padding: '25px', borderRadius: '35px', textAlign: 'center', border: '1px solid #111' }}><p style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', margin: '0 0 5px' }}>HISOBLANGAN SUMMA</p><h3 style={{ fontSize: '28px', margin: 0, fontWeight: '950' }}>{info.cost?.toLocaleString()}</h3></div>
                                        </div>
                                    );
                                }
                                return (
                                    <div style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                            <input type="number" placeholder="Summa kiritish..." value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ flex: 1, padding: '25px', background: '#000', border: '1px solid #222', borderRadius: '25px', color: '#39ff14', fontSize: '24px', fontWeight: '950' }} />
                                            <button onClick={() => handleAction('start')} style={{ background: '#39ff14', color: '#000', border: 'none', width: '85px', borderRadius: '25px' }}><Play fill="#000" size={24} /></button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                            {[30, 60, 120, null].map(m => <button key={m} onClick={() => handleAction('start', m)} style={{ background: '#1a1a1a', border: 'none', color: m ? '#fff' : '#39ff14', padding: '22px 0', borderRadius: '22px', fontSize: '14px', fontWeight: 'bold' }}>{m ? `${m}m` : '∞'}</button>)}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {selectedPC.status !== 'free' && <button onClick={() => handleAction('stop')} style={{ padding: '25px', borderRadius: '30px', background: '#ff444415', color: '#ff4444', border: 'none', fontWeight: '950', fontSize: '16px' }}>STOP ⏹️</button>}
                                <button onClick={() => handleAction(selectedPC.status === 'busy' ? 'pause' : 'start')} style={{ padding: '25px', borderRadius: '30px', background: selectedPC.status === 'busy' ? '#ffee32' : '#39ff14', color: '#000', border: 'none', fontWeight: '950', fontSize: '16px', gridColumn: selectedPC.status === 'free' ? 'span 2' : 'auto' }}>{selectedPC.status === 'busy' ? 'PAUZA' : 'START 🚀'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NAVBAR */}
            <nav style={{ position: 'fixed', bottom: '30px', left: '25px', right: '25px', background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(30px)', border: '1px solid #222', padding: '18px 0', borderRadius: '40px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                {[{ id: 'stats', label: 'Status', icon: <LayoutGrid size={24} /> }, { id: 'rooms', label: 'Xarita', icon: <Monitor size={24} /> }, { id: 'users', label: 'Mijozlar', icon: <Users size={24} /> }].map(nav => (
                    <motion.div key={nav.id} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(nav.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === nav.id ? '#7000ff' : '#444', gap: '5px', cursor: 'pointer' }}>
                        {nav.icon}
                        <span style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' }}>{nav.label.toUpperCase()}</span>
                    </motion.div>
                ))}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
