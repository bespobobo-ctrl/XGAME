import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { LayoutGrid, Monitor, Users, Wallet, BellRing, LogOut, CheckCircle2, AlertCircle, X, Phone, Coffee } from 'lucide-react';

// Modules & Components
import RevenueDashboard from '../components/stats/RevenueDashboard';
import RoomGrid from '../components/inventory/RoomGrid';
import PCControlModal from '../components/pc/PCControlModal';
import LiveTimer from '../components/shared/LiveTimer';

import ManageUsers from '../components/users/ManageUsers';
import ManagerBar from '../components/bar/ManagerBar';
import ManagerKassa from '../components/finance/ManagerKassa';

const ManagerDashboard = ({ onLogout, activeTab, setActiveTab }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalAlert, setGlobalAlert] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Modal States
    const [isReserveMode, setIsReserveMode] = useState(false);
    const [startAmountInput, setStartAmountInput] = useState('');
    const [resName, setResName] = useState('');
    const [resPhone, setResPhone] = useState('');
    const [resTime, setResTime] = useState('');

    const fetchData = async () => {
        try {
            const [s, r] = await Promise.all([
                callAPI(`/api/manager/stats?t=${Date.now()}`),
                callAPI(`/api/manager/rooms?t=${Date.now()}`)
            ]);
            if (s && !s.error) setStats(s);
            if (Array.isArray(r)) {
                setRooms(r);

                // 🔄 Sync current view room
                setSelectedViewRoom(prev => {
                    if (!prev) return null;
                    return r.find(room => room.id === prev.id) || prev;
                });

                // 🔄 Sync selected PC modal
                setSelectedPC(prev => {
                    if (!prev) return null;
                    for (const room of r) {
                        const freshPC = room.Computers?.find(pc => pc.id === prev.id);
                        if (freshPC) return { ...freshPC, roomPrice: room.pricePerHour };
                    }
                    return prev;
                });
            }
        } catch (err) { console.error("Sync error:", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        let socket = null;
        if (window.io) {
            socket = window.io(API_URL || 'https://server.respect-game.uz', {
                transports: ['websocket', 'polling'],
                reconnection: true
            });

            socket.on('connect', () => {
                setSocketConnected(true);
                if (stats?.clubId) socket.emit('join-club', stats.clubId);
            });

            socket.on('disconnect', () => setSocketConnected(false));

            socket.on('upcoming-alert', (data) => {
                setGlobalAlert({ ...data, type: 'info' });
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
                setTimeout(() => setGlobalAlert(null), 15000);
            });

            socket.on('RESERVE_WARNING', (data) => {
                setGlobalAlert(data);
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
                // We keep it longer if it's a manual action required
                setTimeout(() => setGlobalAlert(null), 30000);
            });

            socket.on('pc-status-updated', fetchData);
            socket.on('room_update', fetchData);
        }
        return () => { if (socket) socket.disconnect(); };
    }, [stats?.clubId]);

    const sendFinalWarning = async (sid) => {
        try {
            await callAPI(`/api/manager/reservation/${sid}/confirm-penalty-warning`, { method: 'POST' });
            setGlobalAlert({ type: 'success', message: "Ogohlantirish yuborildi!", pcName: 'INFO' });
            setTimeout(() => setGlobalAlert(null), 3000)
        } catch (e) {
            alert("Xatolik yuz berdi");
        }
    };

    const handleAction = async (action, minutes = null, extraOptions = {}) => {
        if (!selectedPC || actionLoading) return;
        setActionLoading(true);

        const body = {
            action,
            amount: !minutes && action === 'start' ? startAmountInput : null,
            expectedMinutes: minutes || null,
            reserveTime: resTime,
            guestName: extraOptions.guestName || resName,
            guestPhone: extraOptions.guestPhone || resPhone,
            userId: extraOptions.userId || null
        };

        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST', body: JSON.stringify(body)
            });

            if (res.success) {
                setGlobalAlert({
                    type: 'success',
                    message: `Amal bajarildi: ${action.toUpperCase()}`,
                    pcName: selectedPC.name
                });
                setTimeout(() => setGlobalAlert(null), 5000);
                setIsReserveMode(false);
                setResName(''); setResPhone(''); setStartAmountInput('');
                await fetchData();
            } else {
                alert(res.error || "Xatolik yuz berdi");
            }
        } catch (err) {
            alert("Server ulanish xatosi");
        } finally {
            setActionLoading(false);
        }
    };

    const navItem = (id, label, icon) => (
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#999', gap: '4px', cursor: 'pointer', position: 'relative' }}>
            {activeTab === id && (<motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />)}
            <div style={{ padding: '8px', borderRadius: '15px', background: activeTab === id ? 'rgba(112, 0, 255, 0.15)' : 'transparent' }}>{icon}</div>
            <span style={{ fontSize: '9px', fontWeight: '900' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return <div className="loading-screen"><b>GAMEZONE BOSHQARUV PANEL...</b></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '120px' }}>
            <AnimatePresence>
                {globalAlert && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 20, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                        style={{
                            position: 'fixed', top: 0, left: '20px', right: '20px', zIndex: 10000,
                            background: 'rgba(12, 12, 12, 0.6)', backdropFilter: 'blur(45px)',
                            border: '1px solid rgba(112, 0, 255, 0.5)', borderRadius: '35px',
                            padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '12px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(112,0,255,0.2)',
                            maxWidth: '520px', margin: '0 auto'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '16px',
                                background: globalAlert.type === 'success' ? 'linear-gradient(45deg, #10b981, #34d399)' : 'linear-gradient(45deg, #7000ff, #ff007a)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                boxShadow: '0 0 15px rgba(112,0,255,0.4)', flexShrink: 0
                            }}>
                                {globalAlert.type === 'success' ? <CheckCircle2 size={20} color="#fff" strokeWidth={2.5} /> : <BellRing size={20} color="#fff" strokeWidth={2.5} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '10px', fontWeight: '950', color: globalAlert.type === 'success' ? '#10b981' : '#7000ff', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                        {globalAlert.type === 'success' ? 'SUCCESS' : 'NOTIFICATION'}
                                    </h4>
                                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#39ff14' }} />
                                    <button onClick={() => setGlobalAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: '20px', padding: '0', opacity: 0.5, cursor: 'pointer' }}>×</button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '1px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: '950', color: '#fff', whiteSpace: 'nowrap' }}>{globalAlert.pc || globalAlert.pcName || 'SYSTEM'}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.8, fontWeight: '700', color: '#fff' }}>{globalAlert.message}</p>
                            </div>
                        </div>

                        {(globalAlert.type === 'final_warning_request' || globalAlert.phone) && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                {globalAlert.phone && (
                                    <a href={`tel:${globalAlert.phone}`} style={{ flex: 1, textDecoration: 'none' }}>
                                        <button style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', borderRadius: '15px', padding: '12px', fontSize: '12px', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <Phone size={14} /> CALL MIJOZ 📞
                                        </button>
                                    </a>
                                )}
                                {globalAlert.type === 'final_warning_request' && (
                                    <button
                                        onClick={() => globalAlert.sessionId && sendFinalWarning(globalAlert.sessionId)}
                                        style={{ flex: 1, background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', padding: '12px', fontSize: '12px', fontWeight: '950' }}
                                    >
                                        YUBORISH 🚀
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(10,10,10,0.7)',
                backdropFilter: 'blur(35px)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <motion.div
                        animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        style={{
                            width: '8px', height: '8px',
                            background: socketConnected ? 'linear-gradient(45deg, #39ff14, #00ff88)' : '#ff4444',
                            borderRadius: '50%',
                            boxShadow: socketConnected ? '0 0 12px #39ff14' : 'none'
                        }}
                    />
                    <h1 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '950',
                        letterSpacing: '-0.5px',
                        background: 'linear-gradient(90deg, #fff, #999)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {stats?.clubName?.toUpperCase() || 'GAMEZONE'}
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LiveTimer />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onLogout}
                        style={{
                            background: 'rgba(255,51,102,0.1)',
                            border: '1px solid rgba(255,51,102,0.2)',
                            color: '#ff3366',
                            width: '38px', height: '38px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </header>

            <main style={{ paddingBottom: '100px' }}>
                {activeTab === 'stats' && <RevenueDashboard stats={stats} />}
                {activeTab === 'bar' && <ManagerBar rooms={rooms} />}
                {activeTab === 'rooms' && (
                    <RoomGrid
                        rooms={rooms}
                        selectedViewRoom={selectedViewRoom}
                        setSelectedViewRoom={setSelectedViewRoom}
                        setSelectedPC={setSelectedPC}
                        fetchData={fetchData}
                    />
                )}
                {activeTab === 'users' && <ManageUsers stats={stats} />}
                {activeTab === 'payments' && <ManagerKassa />}
            </main>

            <PCControlModal
                selectedPC={selectedPC} setSelectedPC={setSelectedPC}
                isReserveMode={isReserveMode} setIsReserveMode={setIsReserveMode}
                startAmountInput={startAmountInput} setStartAmountInput={setStartAmountInput}
                resName={resName} setResName={setResName}
                resPhone={resPhone} setResPhone={setResPhone}
                resTime={resTime} setResTime={setResTime}
                handleAction={handleAction}
            />

            <nav style={{ position: 'fixed', bottom: '25px', left: '15px', right: '15px', background: 'rgba(12,12,12,0.9)', backdropFilter: 'blur(30px)', padding: '15px 5px', borderRadius: '40px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)' }}>
                {navItem('stats', 'Asosiy', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('bar', 'Bar', <Coffee size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'Kassa', <Wallet size={22} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
