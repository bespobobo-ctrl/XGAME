import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [clubForm, setClubForm] = useState({ name: '', address: '' });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', clubId: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs();
        fetchManagers();
    }, []);

    const fetchClubs = async () => {
        try { const data = await callAPI('/api/admin/clubs'); setClubs(data); } catch (e) { console.error(e); }
    };
    const fetchManagers = async () => {
        try { const data = await callAPI('/api/admin/managers'); setManagers(data); } catch (e) { console.error(e); }
    };

    const handleAddClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('Barcha maydonlarni to\'ldiring!');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', clubForm.name);
            formData.append('address', clubForm.address);
            if (selectedImage) formData.append('image', selectedImage);

            const res = await fetch(`https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert('Klub qo\'shildi! ✅');
                setClubForm({ name: '', address: '' }); setSelectedImage(null);
                fetchClubs();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddManager = async () => {
        if (!managerForm.username || !managerForm.password || !managerForm.clubId) return alert('Barcha maydonlarni to\'ldiring!');
        setLoading(true);
        try {
            const res = await callAPI('/api/admin/managers', {
                method: 'POST',
                body: JSON.stringify(managerForm)
            });
            if (res.success) {
                alert('Menejer muvaffaqiyatli qo\'shildi! 🔥');
                setManagerForm({ username: '', password: '', clubId: '' });
                fetchManagers();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px', color: '#fff' }}>

            {/* 🛰️ SECTION 1: DASHBOARD STATS */}
            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div
                        key="dash" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        style={{ display: 'grid', gap: '20px' }}
                    >
                        {/* 🏢 TOTAL CLUBS CARD */}
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '30px', borderRadius: '30px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#39ff14', filter: 'blur(80px)', opacity: 0.15 }} />
                            <span style={{ fontSize: '12px', color: '#39ff14', letterSpacing: '3px', fontWeight: 'bold' }}>NETWORK SCALE</span>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <h1 style={{ fontSize: '56px', margin: 0, fontWeight: '900', lineHeight: 1 }}>{clubs.length}</h1>
                                <p style={{ margin: 0, opacity: 0.5, marginBottom: '8px' }}>Active Clubs</p>
                            </div>
                        </div>

                        {/* 👥 MANAGERS & USERS STATS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>STAFF</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>USERS</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>1,2K+</h2>
                            </div>
                        </div>

                        {/* 🎮 QUICK ACTIONS */}
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ fontSize: '14px', opacity: 0.3, letterSpacing: '2px', marginBottom: '15px' }}>TEZKOR SOZLAMALAR</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '12px' }}>🛠️ Tizim Loglari</button>
                                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '12px' }}>📊 Moliyaviy Hisobot</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 🏛️ SECTION 2: CLUBS MANAGEMENT */}
                {activeTab === 'clubs' && (
                    <motion.div
                        key="clubs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        style={{ display: 'grid', gap: '30px' }}
                    >
                        <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(57, 255, 20, 0.3)', padding: '30px', borderRadius: '35px' }}>
                            <h2 style={{ margin: '0 0 20px', color: '#39ff14', fontSize: '20px' }}>YANGI KLUB QO'SHISH</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input
                                    placeholder="Klub nomi" value={clubForm.name}
                                    onChange={e => setClubForm({ ...clubForm, name: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '18px', color: '#fff' }}
                                />
                                <input
                                    placeholder="Klub manzili" value={clubForm.address}
                                    onChange={e => setClubForm({ ...clubForm, address: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '18px', color: '#fff' }}
                                />
                                <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px dashed #39ff1499', padding: '15px', borderRadius: '18px', textAlign: 'center', cursor: 'pointer' }}>
                                    <label style={{ cursor: 'pointer', display: 'block' }}>
                                        {selectedImage ? `✅ Rasm tanlandi: ${selectedImage.name}` : '🖼️ KLUB RASMINI TANLASH'}
                                        <input type="file" accept="image/*" hidden onChange={e => setSelectedImage(e.target.files[0])} />
                                    </label>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }} onClick={handleAddClub} disabled={loading}
                                    style={{ background: '#39ff14', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: '900', color: '#000', marginTop: '10px' }}
                                >
                                    {loading ? 'SAQLANMOQDA...' : 'KLUBNI YARATISH 🔥'}
                                </motion.button>
                            </div>
                        </div>

                        {/* LIST OF CLUBS */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {clubs.map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ width: '70px', height: '70px', borderRadius: '15px', background: '#39ff1411', marginRight: '20px', overflow: 'hidden' }}>
                                        {club.image ? <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '30px' }}>🏙️</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '18px' }}>{club.name}</h4>
                                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.4 }}>{club.address}</p>
                                    </div>
                                    <div style={{ color: '#39ff14', background: '#39ff1422', padding: '8px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>ACTIVE</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 👥 SECTION 3: MANAGERS MANAGEMENT */}
                {activeTab === 'managers' && (
                    <motion.div
                        key="managers" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{ display: 'grid', gap: '25px' }}
                    >
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '35px' }}>
                            <h2 style={{ margin: '0 0 20px', color: '#39ff14' }}>YANGI MENEJER TAYINLASH</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input
                                    placeholder="Login (Menejer)" value={managerForm.username}
                                    onChange={e => setManagerForm({ ...managerForm, username: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '18px', color: '#fff' }}
                                />
                                <input
                                    type="password" placeholder="Parol (Xavfsiz)" value={managerForm.password}
                                    onChange={e => setManagerForm({ ...managerForm, password: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '18px', color: '#fff' }}
                                />
                                <select
                                    value={managerForm.clubId}
                                    onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })}
                                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '18px', borderRadius: '18px', color: '#fff' }}
                                >
                                    <option value="">Klubni tanlang...</option>
                                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <motion.button
                                    whileTap={{ scale: 0.95 }} onClick={handleAddManager} disabled={loading}
                                    style={{ background: '#39ff14', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: '900', color: '#000' }}
                                >
                                    MENEJERNI BIRIKTIRISH 👤
                                </motion.button>
                            </div>
                        </div>

                        {/* LIST OF MANAGERS */}
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {managers.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <h5 style={{ margin: 0, fontSize: '16px' }}>{m.username}</h5>
                                        <p style={{ margin: 0, fontSize: '10px', opacity: 0.4 }}>Menejer ID: #{m.id}</p>
                                    </div>
                                    <button style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff444433', color: '#ff4444', padding: '8px 12px', borderRadius: '10px', fontSize: '10px' }}>O'CHIRISH</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
