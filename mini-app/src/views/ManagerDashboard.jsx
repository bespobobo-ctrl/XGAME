import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { LayoutGrid, Monitor, Users, Wallet, BellRing, LogOut, CheckCircle2, AlertCircle, X } from 'lucide-react';

// Modules & Components
import RevenueDashboard from '../components/stats/RevenueDashboard';
import RoomGrid from '../components/inventory/RoomGrid';
import PCControlModal from '../components/pc/PCControlModal';
import LiveTimer from '../components/shared/LiveTimer';

import ManageUsers from '../components/users/ManageUsers';

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
                setGlobalAlert(data);
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
                setTimeout(() => setGlobalAlert(null), 15000);
            });

            socket.on('pc-status-updated', fetchData);
            socket.on('room_update', fetchData);
        }
        return () => { if (socket) socket.disconnect(); };
    }, [stats?.clubId]);

    const handleAction = async (action, minutes = null, extraOptions = {}) => {
        if (!selectedPC || actionLoading) return;
        setActionLoading(true);

        const body = {
            action,
            expectedMinutes: minutes || (action === 'start' ? startAmountInput : null),
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
                            background: 'rgba(12, 12, 12, 0.4)', backdropFilter: 'blur(45px)',
                            border: '1px solid rgba(112, 0, 255, 0.5)', borderRadius: '40px',
                            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(112,0,255,0.2)',
                            maxWidth: '520px', margin: '0 auto'
                        }}
                    >
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
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '1px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '950', color: '#fff', whiteSpace: 'nowrap' }}>{globalAlert.pcName || 'Tizim'}</span>
                                {globalAlert.guestName && (
                                    <>
                                        <span style={{ fontSize: '12px', opacity: 0.4, fontWeight: 'bold' }}>•</span>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#39ff14', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{globalAlert.guestName}</span>
                                    </>
                                )}
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', opacity: 0.8, fontWeight: '700', color: '#fff' }}>{globalAlert.message || "5 daqiqadan so'ng bron davri boshlanadi!"}</p>
                        </div>
                        <div
                            onClick={() => setGlobalAlert(null)}
                            style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                background: 'rgba(255,255,255,0.04)', cursor: 'pointer', opacity: 0.4
                            }}
                        >
                            <X size={14} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: socketConnected ? '#39ff14' : '#ff4444', borderRadius: '50%', boxShadow: socketConnected ? '0 0 10px #39ff14' : 'none' }} />
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '950' }}>{stats?.clubName || 'GAMEZONE'}</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <LiveTimer />
                    <LogOut size={20} onClick={onLogout} style={{ color: '#ff3366', cursor: 'pointer' }} />
                </div>
            </header>

            <main style={{ paddingBottom: '100px' }}>
                {activeTab === 'stats' && <RevenueDashboard stats={stats} />}
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
                {activeTab === 'payments' && (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        <Wallet size={48} style={{ marginBottom: '15px' }} />
                        <h3>Kassa bo'limi</h3>
                        <p>Тo'lovlar tarixi tez kunda qo'shiladi...</p>
                    </div>
                )}
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

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(12,12,12,0.9)', backdropFilter: 'blur(30px)', padding: '15px 10px', borderRadius: '40px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)' }}>
                {navItem('stats', 'Asosiy', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'Kassa', <Wallet size={22} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
