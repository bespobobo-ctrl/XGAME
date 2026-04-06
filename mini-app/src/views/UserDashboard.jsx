import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI, API_URL } from '../api';
import { Monitor, MonitorPlay, Crown, CalendarClock, PowerOff, ChevronRight, ArrowLeft, Pencil, Trash2, Lock, Clock, Play, Square, Ticket, Diamond, Brush, X, CreditCard, Check, XCircle, Image as ImageIcon, Send, History, LayoutGrid, Users, QrCode, Zap, Info, Wallet, Banknote } from 'lucide-react';

const UserDashboard = ({ user, onLogout, setView }) => {
    const [profileData, setProfileData] = useState(null);
    const [roomsData, setRoomsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    const [stats, setStats] = useState({ rooms: 0, total: 0, free: 0, busy: 0 });
    const [pcDetail, setPcDetail] = useState(null);
    const [openRoomId, setOpenRoomId] = useState(null);
    const [reserveTimeInput, setReserveTimeInput] = useState('');
    const [reserveLoading, setReserveLoading] = useState(false);

    const [topupAmount, setTopupAmount] = useState('10000');
    const [receiptFile, setReceiptFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [topupMethod, setTopupMethod] = useState('card'); // card, cash
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const clubName = profileData?.user?.clubName || 'GAME ZONE';
    const userName = (profileData?.user?.name || user?.username || 'GAMER').toUpperCase();

    useEffect(() => {
        if (startParam && startParam.startsWith('pc_') && profileData) {
            const pcId = startParam.substring(3);
            if (window.confirm(`${pcId}-sonli PC ni ochmoqchimisiz?`)) {
                callAPI('/api/player/pc/unlock-with-qr', { method: 'POST', body: JSON.stringify({ qrData: startParam }) })
                    .then(res => {
                        if (res.success) { alert(res.message); fetchData(); }
                        else alert(res.error);
                    });
            }
        }
    }, [startParam, profileData]);

    const fetchData = async () => {
        try {
            const timestamp = Date.now();
            const [profRes, mapRes] = await Promise.all([
                callAPI(`/api/player/me?t=${timestamp}`),
                callAPI(`/api/player/rooms?t=${timestamp}`)
            ]);
            if (profRes.success) setProfileData(profRes);
            if (mapRes.success) {
                setRoomsData(mapRes.rooms || []);
                calculateStats(mapRes.rooms || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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
            const computers = r.Computers || [];
            computers.forEach(pc => {
                total++;
                if (pc.status === 'free' || pc.status === 'available') free++;
                else busy++;
            });
        });
        setStats({ rooms: rooms.length, total, free, busy });
    };

    const handleScanQR = () => {
        if (!window.Telegram?.WebApp?.showScanQrPopup) {
            alert("QR skanerlash faqat Telegram Mini App ichida ishlaydi");
            return;
        }
        window.Telegram.WebApp.showScanQrPopup({ text: "PC ekranidagi QR kodni skanerlang" }, async (text) => {
            if (!text) return true;
            try {
                const res = await callAPI('/api/player/pc/unlock-with-qr', { method: 'POST', body: JSON.stringify({ qrData: text }) });
                if (res.success) { alert(res.message); fetchData(); return true; }
                else { alert(res.error || res.message); return false; }
            } catch (err) { alert("Xatolik!"); return false; }
        });
    };

    const handleReserve = async (pcId) => {
        if (!reserveTimeInput) return alert("Bron qilish vaqtini tanlang!");
        setReserveLoading(true);
        try {
            const res = await callAPI(`/api/player/pc/${pcId}/reserve`, { method: 'POST', body: JSON.stringify({ reserveTime: reserveTimeInput }) });
            if (res.success) { alert('Muvaffaqiyatli bron qilindi! 🎉'); setPcDetail(null); fetchData(); }
            else alert(res.error || res.message);
        } catch (e) { alert('Xatolik!'); }
        finally { setReserveLoading(false); }
    };

    const handleSubmitTopUp = async () => {
        if (!receiptFile && topupMethod === 'card') return alert("To'lov chekini (screenshot) yuklang!");
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('amount', topupAmount);
            if (receiptFile) formData.append('receipt', receiptFile);

            const res = await fetch(`${API_URL}/api/player/topup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) { alert("So'rov yuborildi! Admin tasdiqlashini kuting."); setActiveTab('profile'); fetchData(); }
            else alert(data.error);
        } catch (e) { alert("Serverda xatolik!"); }
        finally { setUploading(false); }
    };

    const navItem = (id, label, icon) => (
        <div onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === id ? '#7000ff' : '#444', gap: '6px', cursor: 'pointer', transition: 'all 0.4s ease', position: 'relative' }}>
            {activeTab === id && <motion.div layoutId="navGlow" style={{ position: 'absolute', top: '-15px', width: '30px', height: '2px', background: '#7000ff', boxShadow: '0 0 15px #7000ff' }} />}
            {icon}
            <span style={{ fontSize: '10px', fontWeight: '900' }}>{label.toUpperCase()}</span>
        </div>
    );

    if (loading && !profileData) return <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid #111', borderTop: '3px solid #7000ff', borderRadius: '50%' }} /></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: '130px', fontFamily: '"Outfit", "Inter", sans-serif' }}>

            <header style={{ padding: '25px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(30px)', zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '1000', color: '#fff', letterSpacing: '-1.5px', textShadow: '0 0 20px rgba(112,0,255,0.3)' }}>{clubName}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 10px #39ff14' }} />
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#39ff14', letterSpacing: '1px' }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={onLogout} style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)', padding: '12px 18px', borderRadius: '18px', fontSize: '11px', fontWeight: '1000', letterSpacing: '1px' }}>EXIT</button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding: '0 20px' }}>

                        <div style={{ marginBottom: '25px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#444', fontWeight: 'bold', letterSpacing: '1px' }}>XUSH KELIBSIZ,</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', letterSpacing: '-1px' }}>{userName} ✨</h2>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={handleScanQR}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #7000ff, #ff00ff)', border: 'none', borderRadius: '35px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', boxShadow: '0 15px 40px -10px rgba(112,0,255,0.6)', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.1), transparent)', pointerEvents: 'none' }} />
                            <QrCode size={28} color="#fff" strokeWidth={3} />
                            <span style={{ fontSize: '18px', fontWeight: '1000', color: '#fff', letterSpacing: '0.5px' }}>SCAN QR CODE</span>
                        </motion.button>

                        <div style={{ background: 'linear-gradient(145deg, #0f0f0f, #050505)', borderRadius: '45px', padding: '35px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '150px', height: '150px', background: '#7000ff', filter: 'blur(80px)', opacity: 0.1 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Wallet size={16} color="#7000ff" strokeWidth={3} /><span style={{ fontSize: '12px', color: '#666', fontWeight: '900', letterSpacing: '1px' }}>MAX BALANCE</span></div>
                            </div>
                            <h1 style={{ margin: 0, fontSize: '50px', fontWeight: '1000', letterSpacing: '-2.5px', color: '#fff' }}>{profileData?.user?.balance?.toLocaleString()} <span style={{ fontSize: '18px', color: '#333' }}>UZS</span></h1>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('topup')} style={{ marginTop: '30px', width: '100%', padding: '20px', background: '#fff', color: '#000', borderRadius: '25px', fontWeight: '1000', fontSize: '14px', border: 'none', boxShadow: '0 10px 20px rgba(255,255,255,0.1)' }}>TOP UP WALLET</motion.button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '25px' }}>
                            {[
                                { l: 'XONALAR', v: stats.rooms, c: '#7000ff' },
                                { l: 'BO\'SH PC', v: stats.free, c: '#39ff14' },
                                { l: 'BAND PC', v: stats.busy, c: '#ff00ff' }
                            ].map((s, i) => (
                                <div key={i} style={{ background: '#111', padding: '15px 5px', borderRadius: '22px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                                    <h4 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: s.c }}>{s.v}</h4>
                                    <p style={{ margin: 0, fontSize: '9px', color: '#444', fontWeight: 'bold' }}>{s.l}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: '#0a0a0a', borderRadius: '40px', padding: '25px', border: '1px solid #131313' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><History size={18} color="#7000ff" /><span style={{ fontSize: '12px', fontWeight: 'bold', color: '#444' }}>OXIRGI PC-LAR</span></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(() => {
                                    const uniqueRecent = [];
                                    const seen = new Set();
                                    (profileData?.user?.Sessions || []).forEach(s => {
                                        if (s.Computer && !seen.has(s.Computer.id)) { uniqueRecent.push(s.Computer); seen.add(s.Computer.id); }
                                    });
                                    if (uniqueRecent.length === 0) return <p style={{ textAlign: 'center', padding: '20px', color: '#333', fontSize: '12px' }}>Hozircha ma'lumot yo'q</p>;
                                    return uniqueRecent.slice(0, 3).map(pc => {
                                        const isAvailable = (pc.status || '').toLowerCase() === 'free' || (pc.status || '').toLowerCase() === 'available';
                                        return (
                                            <div key={pc.id} onClick={() => isAvailable && setPcDetail(pc)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '15px 20px', borderRadius: '22px', border: '1.5px solid #131313', cursor: isAvailable ? 'pointer' : 'default' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: isAvailable ? '#39ff1411' : '#ff00ff11', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Monitor size={20} color={isAvailable ? '#39ff14' : '#ff00ff'} /></div>
                                                    <div><div style={{ fontSize: '15px', fontWeight: '900' }}>{pc.name}</div><div style={{ fontSize: '9px', color: isAvailable ? '#39ff14' : '#ff00ff', fontWeight: 'bold' }}>{isAvailable ? 'BRON QILISH' : 'BAND'}</div></div>
                                                </div>
                                                {isAvailable && <div style={{ background: '#111', padding: '8px', borderRadius: '12px' }}><CalendarClock size={16} color="#7000ff" /></div>}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'map' && (
                    <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '0 20px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '25px', letterSpacing: '-1px' }}>KLUB XARITASI</h2>
                        {roomsData.map(room => (
                            <div key={room.id} style={{ background: '#0a0a0a', borderRadius: '40px', overflow: 'hidden', border: '1px solid #131313', marginBottom: '15px' }}>
                                <div onClick={() => setOpenRoomId(openRoomId === room.id ? null : room.id)} style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900' }}>{(room.name || '').toUpperCase()}</h3>
                                        <p style={{ margin: '3px 0 0', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>{room.Computers?.length} PC • {room.pricePerHour.toLocaleString()} UZS/S</p>
                                    </div>
                                    <motion.div animate={{ rotate: openRoomId === room.id ? 90 : 0 }}><ChevronRight size={18} color="#222" /></motion.div>
                                </div>
                                <AnimatePresence>
                                    {openRoomId === room.id && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', padding: '0 20px 25px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '10px' }}>
                                                {room.Computers?.map(pc => {
                                                    const isAvailable = (pc.status || '').toLowerCase() === 'free' || (pc.status || '').toLowerCase() === 'available';
                                                    return (
                                                        <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setPcDetail(pc)} style={{ background: '#000', border: '1.5px solid #131313', borderRadius: '25px', padding: '20px 5px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                                                            {isAvailable && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '5px', height: '5px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 8px #39ff14' }} />}
                                                            <Monitor size={26} color={isAvailable ? '#39ff14' : '#ff00ff'} />
                                                            <div style={{ fontSize: '11px', fontWeight: '950', marginTop: '10px' }}>{pc.name}</div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'topup' && (
                    <motion.div key="topup" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '0 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <button onClick={() => setActiveTab('profile')} style={{ background: '#111', border: 'none', color: '#fff', width: '45px', height: '45px', borderRadius: '18px' }}><ArrowLeft size={18} /></button>
                            <h2 style={{ fontSize: '24px', fontWeight: '900' }}>TO'LOV QILISH</h2>
                        </div>

                        {/* 🔘 TO'LOV USULI SWITCHER */}
                        <div style={{ display: 'flex', background: '#111', padding: '6px', borderRadius: '20px', marginBottom: '25px', border: '1px solid #1a1a1a' }}>
                            <button onClick={() => setTopupMethod('card')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '15px', background: topupMethod === 'card' ? '#7000ff' : 'transparent', color: '#fff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <CreditCard size={16} /> KARTA
                            </button>
                            <button onClick={() => setTopupMethod('cash')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '15px', background: topupMethod === 'cash' ? '#39ff14' : 'transparent', color: topupMethod === 'cash' ? '#000' : '#fff', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Banknote size={16} /> NAQD PUL
                            </button>
                        </div>

                        <div style={{ background: 'linear-gradient(135deg, #1c1c1e, #0a0a0a)', borderRadius: '40px', padding: '30px', border: '1px solid #222' }}>
                            {topupMethod === 'card' ? (
                                <>
                                    <div style={{ background: '#000', padding: '25px', borderRadius: '30px', border: '1.5px dashed #333', marginBottom: '25px' }}>
                                        <p style={{ margin: '0 0 10px', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>KARTA RAQAMI:</p>
                                        <h3 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px', fontWeight: '900' }}>{profileData?.club?.cardNumber || '---- ---- ---- ----'}</h3>
                                        <p style={{ margin: '15px 0 0', fontSize: '13px', fontWeight: 'bold', color: '#7000ff' }}>EGASI: {profileData?.club?.cardOwner || 'MA\'LUMOT YO\'Q'}</p>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '11px', color: '#444', marginBottom: '10px', display: 'block' }}>SUMMA (UZS):</label>
                                        <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} style={{ width: '100%', padding: '22px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '25px', color: '#fff', fontSize: '24px', fontWeight: '900', textAlign: 'center' }} />
                                    </div>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ fontSize: '11px', color: '#444', marginBottom: '10px', display: 'block' }}>TO'LOV CHEKI (SCREENSHOT):</label>
                                        <div style={{ position: 'relative' }}>
                                            <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, zIndex: 1, cursor: 'pointer' }} />
                                            <div style={{ padding: '30px', background: receiptFile ? '#39ff1408' : '#000', border: `2px dashed ${receiptFile ? '#39ff14' : '#1a1a1a'}`, borderRadius: '30px', textAlign: 'center' }}>
                                                {receiptFile ? <span style={{ color: '#39ff14', fontSize: '13px', fontWeight: '900' }}>✅ {receiptFile.name}</span> : <div style={{ color: '#444' }}><ImageIcon size={30} style={{ marginBottom: '10px' }} /><br /><span style={{ fontSize: '11px' }}>YUKLASH</span></div>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleSubmitTopUp} disabled={uploading} style={{ width: '100%', padding: '25px', background: '#7000ff', color: '#fff', borderRadius: '25px', fontWeight: '950', fontSize: '15px', border: 'none' }}>{uploading ? 'YUBORILMOQDA...' : 'TASDIQLASHGA YUBORISH'}</button>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <div style={{ width: '100px', height: '100px', background: '#39ff1411', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}><Banknote size={45} color="#39ff14" /></div>
                                    <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '15px' }}>NAQD TO'LOV</h3>
                                    <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.6', marginBottom: '30px' }}>Administrator (Kassir) yaniga boring va naqd pulni bering. Admin tizim orqali balansni o'sha zahoti hisobingizga qo'shib beradi.</p>
                                    <div style={{ background: '#000', padding: '20px', borderRadius: '25px', border: '1px solid #1a1a1a' }}>
                                        <p style={{ margin: '0 0 5px', fontSize: '10px', color: '#444' }}>SIZNING ID:</p>
                                        <h4 style={{ margin: 0, fontSize: '24px', fontWeight: '950', color: '#39ff14' }}>#{profileData?.user?.id || '0000'}</h4>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {pcDetail && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={(e) => e.target === e.currentTarget && setPcDetail(null)}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ background: '#080808', width: '100%', padding: '45px 25px', borderRadius: '50px 50px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '1000', letterSpacing: '-2px', color: '#fff' }}>{pcDetail.name}</h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                        <div style={{ width: '8px', height: '8px', background: '#7000ff', borderRadius: '50%', boxShadow: '0 0 10px #7000ff' }} />
                                        <span style={{ fontSize: '11px', color: '#7000ff', fontWeight: '900', letterSpacing: '1.5px' }}>PREMIUM BRON QILISH</span>
                                    </div>
                                </div>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPcDetail(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', width: '55px', height: '55px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}><X size={26} /></motion.button>
                            </div>

                            {((pcDetail.status || '').toLowerCase() === 'free' || (pcDetail.status || '').toLowerCase() === 'available') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                    <div style={{ background: '#000', padding: '40px 30px', borderRadius: '40px', border: '1.5px solid rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 30px rgba(112,0,255,0.05)', position: 'relative' }}>
                                        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#444', fontWeight: '1000', textAlign: 'center', letterSpacing: '2px' }}>VAQTNI KIRITING</p>
                                        <input
                                            type="text"
                                            placeholder="00 : 00"
                                            value={reserveTimeInput}
                                            onChange={e => {
                                                let val = e.target.value.replace(/[^0-9:]/g, '');
                                                if (val.length === 2 && !val.includes(':')) val += ':';
                                                if (val.length > 5) val = val.substring(0, 5);
                                                setReserveTimeInput(val);
                                            }}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '48px', textAlign: 'center', fontWeight: '1000', fontFamily: 'monospace', outline: 'none', letterSpacing: '3px' }}
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleReserve(pcDetail.id)}
                                        disabled={reserveLoading || reserveTimeInput.length < 5}
                                        style={{
                                            width: '100%',
                                            padding: '28px',
                                            background: (reserveTimeInput.length < 5) ? '#111' : 'linear-gradient(135deg, #39ff14, #00cc00)',
                                            color: (reserveTimeInput.length < 5) ? '#333' : '#000',
                                            borderRadius: '35px',
                                            fontWeight: '1000',
                                            fontSize: '18px',
                                            border: 'none',
                                            boxShadow: (reserveTimeInput.length < 5) ? 'none' : '0 15px 35px -10px rgba(57,255,20,0.5)',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                    >
                                        {reserveLoading ? 'YUKLANMOQDA...' : (reserveTimeInput.length < 5 ? 'VAQTNI TO\'LIQ YAZING' : 'BRONNI TASDIQLASH ✅')}
                                    </motion.button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <Info size={45} color="#222" style={{ marginBottom: '20px' }} />
                                    <p style={{ margin: 0, fontSize: '14px', color: '#555', fontWeight: '900', letterSpacing: '0.5px' }}>Bu kompyuter hozir band yoki ishlayabdi.</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav style={{ position: 'fixed', bottom: '30px', left: '20px', right: '20px', background: 'rgba(12,12,14,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.05)', padding: '18px 0', borderRadius: '35px', display: 'flex', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                {navItem('profile', 'Asosiy', <Zap size={22} color={activeTab === 'profile' ? '#7000ff' : '#444'} />)}
                {navItem('map', 'Xarita', <LayoutGrid size={22} color={activeTab === 'map' ? '#7000ff' : '#444'} />)}
                {navItem('topup', 'Hisob', <Wallet size={22} color={activeTab === 'topup' ? '#7000ff' : '#444'} />)}
            </nav>
        </div>
    );
};

export default UserDashboard;
