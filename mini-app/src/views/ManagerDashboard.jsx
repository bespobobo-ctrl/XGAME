import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { LayoutGrid, Monitor, Users, Wallet, BellRing, Clock, LogOut } from 'lucide-react';

// Modules & Components
import RevenueDashboard from '../components/stats/RevenueDashboard';
import RoomGrid from '../components/inventory/RoomGrid';
import PCControlModal from '../components/pc/PCControlModal';
import LiveTimer from '../components/shared/LiveTimer';

const ManagerDashboard = ({ onLogout, activeTab, setActiveTab }) => {
    const [stats, setStats] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPC, setSelectedPC] = useState(null);
    const [selectedViewRoom, setSelectedViewRoom] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalAlert, setGlobalAlert] = useState(null);

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
            if (Array.isArray(r)) setRooms(r);
        } catch (err) { console.error("Sync error:", err); }
        finally { setLoading(false); }
    };

    // 🔄 PERIODIC DATA FETCHING
    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 5000);
        return () => clearInterval(dataInterval);
    }, [activeTab]);

    // 🔌 SOCKET.IO FOR REAL-TIME UPDATES
    useEffect(() => {
        let socket = null;
        if (window.io) {
            socket = window.io(API_URL || 'https://server.respect-game.uz', {
                transports: ['websocket'],
                reconnection: true
            });

            // Join specific club room for instant updates
            if (stats?.clubId) {
                console.log("🔌 Joining club room:", stats.clubId);
                socket.emit('join-club', stats.clubId);
            }

            socket.on('upcoming-alert', (data) => {
                setGlobalAlert(data);
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { });
                setTimeout(() => setGlobalAlert(null), 15000);
            });

            socket.on('pc-status-updated', fetchData);
            socket.on('room_update', fetchData);

            socket.on('connect', () => {
                if (stats?.clubId) socket.emit('join-club', stats.clubId);
            });
        }
        return () => { if (socket) socket.disconnect(); };
    }, [stats?.clubId]);

    const handleAction = async (action, expectedMinutes = null) => {
        if (!selectedPC || actionLoading) return;

        // Optimistic UI Update
        const tempStatus = action === 'start' ? 'busy' : action === 'reserve' ? 'reserved' : action === 'stop' ? 'free' : action === 'pause' ? 'paused' : 'active';
        setRooms(prev => prev.map(room => ({
            ...room, Computers: room.Computers?.map(pc => pc.id === selectedPC.id ? { ...pc, status: tempStatus } : pc)
        })));

        setActionLoading(true);
        let finalMinutes = expectedMinutes;
        if (action === 'start' && !expectedMinutes && startAmountInput > 0)
            finalMinutes = Math.floor((parseInt(startAmountInput) / selectedPC.roomPrice) * 60);

        try {
            const res = await callAPI(`/api/manager/pc/${selectedPC.id}/action`, {
                method: 'POST', body: JSON.stringify({ action, expectedMinutes: finalMinutes, reserveTime: resTime, guestName: resName, guestPhone: resPhone })
            });
            if (res.success) {
                await fetchData();
                setSelectedPC(null);
                setIsReserveMode(false);
                setStartAmountInput('');
            } else { alert(res.error || "Error!"); fetchData(); }
        } catch (e) { alert("Network error!"); fetchData(); }
        finally { setActionLoading(false); }
    };

    const navItem = (id, label, icon) => (
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#999', gap: '4px', cursor: 'pointer', position: 'relative' }}>
            {activeTab === id && (<motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '20px', height: '3px', background: '#7000ff', borderRadius: '4px', boxShadow: '0 0 10px #7000ff' }} />)}
            <div style={{ padding: '8px', borderRadius: '15px', background: activeTab === id ? 'rgba(112, 0, 255, 0.15)' : 'transparent' }}>{icon}</div>
            <span style={{ fontSize: '9px', fontWeight: '900' }}>{label.toUpperCase()}</span>
        </motion.div>
    );

    if (loading && !stats) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#7000ff' }}><b>TIZIM ISHGA TUSHMOQDA...</b></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '120px', overflowX: 'hidden' }}>
            <AnimatePresence>
                {globalAlert && (
                    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }} style={{ position: 'fixed', top: 0, left: '15px', right: '15px', zIndex: 5000, background: 'linear-gradient(90deg, #7000ff, #000)', padding: '24px', borderRadius: '35px', border: '1px solid #fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <BellRing size={28} />
                        <div style={{ flex: 1 }}><b style={{ fontSize: '18px', display: 'block' }}>ESLATMA! 🚨</b><span><b>{globalAlert.pcName}</b> кутилмоқда!</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '22px', background: '#7000ff', borderRadius: '4px' }} />
                    <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '950' }}>{stats?.clubName || 'GAMEZONE'}</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <LiveTimer />
                    <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: '#ff3366', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px' }}>
                        <LogOut size={22} />
                    </button>
                </div>
            </header>

            <main>
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

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(12,12,12,0.96)', backdropFilter: 'blur(40px)', padding: '15px 10px', borderRadius: '45px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, border: '1px solid rgba(255,255,255,0.1)' }}>
                {navItem('stats', 'Asosiy', <LayoutGrid size={22} />)}
                {navItem('rooms', 'Xarita', <Monitor size={22} />)}
                {navItem('users', 'Mijozlar', <Users size={22} />)}
                {navItem('payments', 'Kassa', <Wallet size={22} />)}
            </nav>
        </div>
    );
};

export default ManagerDashboard;
