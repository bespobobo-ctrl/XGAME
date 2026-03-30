import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon } from 'lucide-react';

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

            // Set initial card info from stats/club
            if (s?.cardNumber) {
                setClubSettings({ cardNumber: s.cardNumber, cardOwner: s.cardOwner || '' });
            }
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(fetchData, 5000);
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
                setSelectedPC(null);
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

    const renderPC = (pc) => {
        const isActive = pc.status === 'busy' || pc.status === 'paused';
        const color = pc.status === 'busy' ? '#ff00ff' : pc.status === 'paused' ? '#ffee32' : pc.status === 'reserved' ? '#ffaa00' : '#39ff14';

        return (
            <motion.div
                key={pc.id} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPC(pc)}
                style={{ background: '#111', border: `1px solid ${isActive ? color : '#222'}`, borderRadius: '20px', padding: '20px 10px', textAlign: 'center', cursor: 'pointer' }}
            >
                <div style={{ color: color, marginBottom: '10px' }}><Monitor size={28} /></div>
                <span style={{ fontSize: '12px', fontWeight: '900' }}>{pc.name}</span>
                <div style={{ fontSize: '10px', color: color, marginTop: '5px' }}>{pc.status.toUpperCase()}</div>
            </motion.div>
        );
    };

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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #333' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>BUGUNGI KIRIM</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '24px', color: '#39ff14' }}>{stats?.revenue?.day?.toLocaleString()} <span style={{ fontSize: '12px' }}>UZS</span></h3>
                            </div>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #333' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#888' }}>KUTILAYOTGAN TO'LOV</p>
                                <h3 style={{ margin: '5px 0 0', fontSize: '24px', color: '#ffaa00' }}>{topupRequests.length} <span style={{ fontSize: '12px' }}>ta</span></h3>
                            </div>
                        </div>

                        {/* Recent Transactions / Topups Notification */}
                        {topupRequests.length > 0 && (
                            <motion.div
                                onClick={() => setActiveTab('payments')}
                                whileTap={{ scale: 0.98 }}
                                style={{ background: 'linear-gradient(90deg, #7000ff, #007aff)', padding: '20px', borderRadius: '25px', marginBottom: '25px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>KUTILAYOTGAN TO'LOVLAR!</h4>
                                    <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>{topupRequests.length} ta chek tasdiqlash uchun navbatda turibdi.</p>
                                </div>
                                <ChevronRight />
                            </motion.div>
                        )}

                        {/* Stats detail sections... (kept short for brevity) */}
                        <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#888' }}>OXIRGI SEANSIYALAR</h4>
                            {stats?.recentSessions?.map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                                    <div style={{ fontSize: '13px' }}>{s.pc} - {s.user}</div>
                                    <div style={{ fontSize: '13px', color: '#39ff14' }}>{s.cost?.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rooms' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        {rooms.map(room => (
                            <div key={room.id} style={{ marginBottom: '30px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px' }}>{room.name.toUpperCase()}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                                    {room.Computers?.map(pc => renderPC(pc))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>TO'LOVLARNI TASDIQLASH 💰</h2>
                        {topupRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '100px', color: '#444' }}>
                                <CreditCard size={60} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                <p>Hozircha yangi to'lov so'rovlari yo'q</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {topupRequests.map(req => (
                                    <div key={req.id} style={{ background: '#111', borderRadius: '25px', padding: '20px', border: '1px solid #222' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '18px' }}>{req.User?.username}</h4>
                                                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{new Date(req.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <h4 style={{ margin: 0, fontSize: '20px', color: '#39ff14' }}>{req.amount.toLocaleString()} UZS</h4>
                                            </div>
                                        </div>

                                        {req.receiptImage && (
                                            <button
                                                onClick={() => setSelectedReceipt(req)}
                                                style={{ width: '100%', background: '#222', border: 'none', color: '#fff', padding: '12px', borderRadius: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                            >
                                                <ImageIcon size={18} /> CHEKNI KO'RISH
                                            </button>
                                        )}

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleApproveTopup(req.id, 'reject')}
                                                style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: 'none', fontWeight: 'bold' }}
                                            >
                                                RAD ETISH
                                            </button>
                                            <button
                                                onClick={() => handleApproveTopup(req.id, 'approve')}
                                                style={{ flex: 2, padding: '15px', borderRadius: '15px', background: '#39ff14', color: '#000', border: 'none', fontWeight: 'bold' }}
                                            >
                                                TASDIQLASH ✅
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
                        <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '14px', color: '#7000ff' }}>TO'LOV SOZLAMALARI</h4>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>KARTA RAQAMI (UZCARD/HUMO):</label>
                                <input
                                    value={clubSettings.cardNumber}
                                    onChange={e => setClubSettings({ ...clubSettings, cardNumber: e.target.value })}
                                    placeholder="8600 ...."
                                    style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '5px' }}>KARTA EGASI ISMI:</label>
                                <input
                                    value={clubSettings.cardOwner}
                                    onChange={e => setClubSettings({ ...clubSettings, cardOwner: e.target.value })}
                                    placeholder="AZIZBEK A."
                                    style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}
                                />
                            </div>
                            <button onClick={handleUpdateCard} style={{ width: '100%', padding: '15px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>SAQLASH</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Receipt Preview Modal */}
            <AnimatePresence>
                {selectedReceipt && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <h3 style={{ color: '#fff', marginBottom: '20px' }}>{selectedReceipt.User?.username} yuborgan chek</h3>
                        <img
                            src={`${API_URL}/${selectedReceipt.receiptImage.replace(/\\/g, '/')}`}
                            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '20px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                            alt="Receipt"
                        />
                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', width: '100%', maxWidth: '300px' }}>
                            <button onClick={() => setSelectedReceipt(null)} style={{ flex: 1, padding: '15px', background: '#333', border: 'none', color: '#fff', borderRadius: '15px' }}>YOPISH</button>
                            <button
                                onClick={() => { handleApproveTopup(selectedReceipt.id, 'approve'); setSelectedReceipt(null); }}
                                style={{ flex: 1, padding: '15px', background: '#39ff14', color: '#000', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}
                            >
                                TASDIQLASH
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shared Nav handled by App.jsx */}
        </div>
    );
};

export default ManagerDashboard;
