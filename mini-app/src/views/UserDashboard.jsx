import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send } from 'lucide-react';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // profile, map, topup

    const [stats, setStats] = useState({ total: 0, free: 0, busy: 0 });
    const [selectedPC, setSelectedPC] = useState(null);
    const [pcDetail, setPcDetail] = useState(null);
    const [openRoomId, setOpenRoomId] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    // 💸 TOP-UP STATES
    const [topupAmount, setTopupAmount] = useState('10000');
    const [receiptFile, setReceiptFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const clubName = profileData?.user?.clubName || 'GAME ZONE';
    const userName = profileData?.user?.name || user?.username || 'Gamer';

    const fetchData = async () => {
        try {
            const [profRes, mapRes] = await Promise.all([
                callAPI('/api/player/me'),
                callAPI('/api/player/rooms')
            ]);
            if (profRes.success) setProfileData(profRes);
            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
                if (mapRes.rooms?.length === 1 && !openRoomId) {
                    setOpenRoomId(mapRes.rooms[0].id);
                }
            } else {
                setError(mapRes.error || mapRes.message || "Ma'lumotlarni yuklab bo'lmadi");
            }
        } catch (err) {
            setError("Server bilan aloqa uzildi! 🔌");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const calculateStats = (rooms) => {
        let total = 0, free = 0, busy = 0;
        if (!Array.isArray(rooms)) return;
        rooms.forEach(r => {
            const computers = r.Computers || r.computers || [];
            computers.forEach(pc => {
                total++;
                if (pc.status === 'free') free++;
                else busy++;
            });
        });
        setStats({ total, free, busy });
    };

    const handleScanQR = () => {
        if (!window.Telegram?.WebApp?.showScanQrPopup) {
            alert("QR skanerlash faqat Telegram Mini App ichida ishlaydi");
            return;
        }

        window.Telegram.WebApp.showScanQrPopup({ text: "Kompyuter ekranidagi QR kodni skanerlang" }, async (text) => {
            if (!text) return true;
            try {
                const res = await callAPI('/api/player/pc/unlock-with-qr', {
                    method: 'POST',
                    body: JSON.stringify({ qrData: text })
                });
                if (res.success) {
                    alert(res.message);
                    fetchData();
                    return true;
                } else {
                    alert(res.error || res.message);
                    return false;
                }
            } catch (err) {
                alert("Xatolik yuz berdi");
                return false;
            }
        });
    };

    const handleSubmitTopUp = async () => {
        if (!receiptFile || !topupAmount) return alert("Summani kiriting va chekni yuklang!");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('amount', topupAmount);
            formData.append('receipt', receiptFile);

            const res = await fetch(`${window.API_URL || '/api'}/player/topup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setTopupAmount('10000');
                setReceiptFile(null);
                setActiveTab('profile');
                fetchData();
            } else { alert(data.error); }
        } catch (error) { alert("Serverga ulanishda xato!"); }
        finally { setUploading(false); }
    };

    const handleReserve = async () => {
        if (!selectedPC || !reserveTimeInput) return;
        setReserveLoading(true);
        try {
            const res = await callAPI(`/api/player/pc/${selectedPC.id}/reserve`, {
                method: 'POST',
                body: JSON.stringify({ reserveTime: reserveTimeInput })
            });
            if (res.success) {
                alert('Muvaffaqiyatli bron qilindi! 🎉');
                setSelectedPC(null);
                fetchData();
            } else { alert(res.error || res.message); }
        } catch (error) { alert('Internet bilan muammo'); }
        finally { setReserveLoading(false); }
    };

    const getTimeDiff = (sinceDate) => {
        if (!sinceDate) return '...';
        const diff = Math.floor((new Date() - new Date(sinceDate)) / 60000);
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} daqiqa`;
    };

    const navItem = (id, label, icon) => (
        <div
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                color: activeTab === id ? '#7000ff' : '#666', cursor: 'pointer', transition: '0.3s'
            }}
        >
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>{label}</span>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '20px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', margin: 0, fontWeight: '900', letterSpacing: '-1px' }}>{clubName.toUpperCase()}</h1>
                    <p style={{ color: '#888', margin: 0, fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>DASHBOARD</p>
                </div>
                <button onClick={onLogout} style={{ background: '#ff444411', color: '#ff4444', border: 'none', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '10px' }}>CHIQISH</button>
            </header>

            {loading && roomsData.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ border: '3px solid #222', borderTop: '3px solid #7000ff', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
                </div>
            ) : (
                <AnimatePresence mode='wait'>
                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '14px', color: '#888' }}>Salom,</h3>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900' }}>{userName} ✨</h2>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleScanQR}
                                style={{ background: 'linear-gradient(135deg, #007aff, #5856d6)', border: 'none', color: '#fff', padding: '25px', borderRadius: '25px', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}
                            >
                                <ImageIcon size={30} /> QR KIRISH
                            </motion.button>

                            <div style={{ background: 'linear-gradient(135deg, #111, #050505)', borderRadius: '25px', padding: '25px', border: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: '#7000ff', fontWeight: 'bold' }}>BALANSINGIZ</h4>
                                    <button
                                        onClick={() => setActiveTab('topup')}
                                        style={{ background: '#7000ff22', border: 'none', color: '#7000ff', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}
                                    >+ TO'LDIRISH</button>
                                </div>
                                <h4 style={{ margin: 0, fontSize: '36px', fontWeight: '900' }}>{profileData?.user?.balance?.toLocaleString()} <span style={{ fontSize: '14px', color: '#444' }}>UZS</span></h4>
                            </div>

                            <div style={{ background: '#111', borderRadius: '25px', padding: '20px', border: '1px solid #222' }}>
                                <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#444' }}>OXIRGI HARAKATLAR</h4>
                                {profileData?.user?.Transactions?.slice(0, 3).map((t, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                                        <div style={{ fontSize: '13px' }}>{t.description || t.type}</div>
                                        <div style={{ fontSize: '13px', color: t.type === 'deposit' ? '#39ff14' : '#ff4444', fontWeight: 'bold' }}>
                                            {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString()}
                                            {t.status === 'pending' && ' 🕒'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'map' && (
                        <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {roomsData.map(room => (
                                <div key={room.id} style={{ background: '#111', borderRadius: '25px', border: '1px solid #222', overflow: 'hidden' }}>
                                    <div onClick={() => setOpenRoomId(openRoomId === room.id ? null : room.id)} style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{room.name.toUpperCase()}</h3>
                                            <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#444' }}>{room.Computers?.length} PC • JAMI</p>
                                        </div>
                                        <ChevronRight style={{ transform: openRoomId === room.id ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
                                    </div>
                                    <AnimatePresence>
                                        {openRoomId === room.id && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', padding: '0 15px 20px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                                                    {room.Computers?.map(pc => (
                                                        <div
                                                            key={pc.id}
                                                            onClick={() => setPcDetail(pc)}
                                                            style={{
                                                                background: '#000', border: `1px solid ${pc.status === 'free' ? '#39ff14' : pc.status === 'reserved' ? '#ffaa00' : '#ff00ff'}22`,
                                                                borderRadius: '15px', padding: '15px 5px', textAlign: 'center'
                                                            }}
                                                        >
                                                            <Monitor size={24} style={{ color: pc.status === 'free' ? '#39ff14' : pc.status === 'reserved' ? '#ffaa00' : '#ff00ff' }} />
                                                            <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '5px' }}>{pc.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'topup' && (
                        <motion.div key="topup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <button onClick={() => setActiveTab('profile')} style={{ background: '#222', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px' }}><ArrowLeft size={18} /></button>
                                <h2 style={{ fontSize: '24px', fontWeight: '900' }}>BALANS TO'LDIRISH</h2>
                            </div>

                            <div style={{ background: 'linear-gradient(135deg, #1c1c1e, #0a0a0a)', borderRadius: '25px', padding: '25px', border: '1px solid #333' }}>
                                <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#7000ff', letterSpacing: '1px' }}>KARTA MA'LUMOTLARI</h4>
                                <div style={{ background: '#000', padding: '20px', borderRadius: '20px', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', color: '#666' }}>KARTA RAQAMI:</span>
                                        <CreditCard size={18} color="#7000ff" />
                                    </div>
                                    <h4 style={{ fontSize: '22px', letterSpacing: '4px', margin: 0, fontWeight: 'bold' }}>{profileData?.club?.cardNumber || '---- ---- ---- ----'}</h4>
                                    <p style={{ margin: '15px 0 0', fontSize: '14px', fontWeight: 'bold', color: '#888' }}>EGASI: {profileData?.club?.cardOwner || "MA'LUMOT YO'Q"}</p>
                                </div>
                                <p style={{ fontSize: '11px', color: '#555', lineHeight: '1.5' }}>💡 Ushbu kartaga kerakli summani o'tkazing va to'lov chekini (screenshot) pastdagi tugma orqali yuklang.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>O'TKAZILGAN SUMMA (UZS):</label>
                                    <input
                                        type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                                        style={{ width: '100%', padding: '18px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '20px', fontSize: '20px', fontWeight: 'bold' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>TO'LOV CHEKI (SNAPSHOT):</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="file" accept="image/*"
                                            onChange={e => setReceiptFile(e.target.files[0])}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, zIndex: 2, cursor: 'pointer' }}
                                        />
                                        <div style={{ width: '100%', padding: '30px', background: receiptFile ? '#39ff1411' : '#111', border: `2px dashed ${receiptFile ? '#39ff14' : '#333'}`, borderRadius: '20px', textAlign: 'center' }}>
                                            {receiptFile ? (
                                                <div style={{ color: '#39ff14', fontWeight: 'bold' }}>📸 {receiptFile.name} TANLANDI</div>
                                            ) : (
                                                <div style={{ color: '#666' }}><ImageIcon size={30} style={{ marginBottom: '10px' }} /><br />GALEREYADAN TANLASH</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmitTopUp} disabled={uploading}
                                    style={{ width: '100%', padding: '20px', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    {uploading ? 'YUKLANMOQDA...' : <><Send size={20} /> TO'LOVNI TASDIQLASHGA YUBORISH</>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            <nav style={{ position: 'fixed', bottom: '25px', left: '20px', right: '20px', background: 'rgba(28,28,30,0.8)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px 25px', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                {navItem('profile', 'Profil', '👤')}
                {navItem('map', 'Xarita', '🗺️')}
                {navItem('topup', 'Balans', '💰')}
            </nav>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

export default UserDashboard;
