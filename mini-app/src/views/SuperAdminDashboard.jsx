import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', priority: 0 });
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
            formData.append('level', clubForm.level);
            formData.append('priority', clubForm.priority);
            if (selectedImage) formData.append('image', selectedImage);

            const res = await fetch(`https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert('Klub yaratildi! 🔥');
                setClubForm({ name: '', address: '', level: 'standard', priority: 0 }); setSelectedImage(null);
                fetchClubs();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const toggleClubStatus = async (club) => {
        const newStatus = club.status === 'active' ? 'blocked' : 'active';
        try {
            await callAPI(`/api/admin/clubs/${club.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    const deleteClub = async (id) => {
        if (!window.confirm('Haqiqatan ham bu klubni butunlay o\'chirmoqchimisiz? 🗑️')) return;
        try {
            await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' });
            fetchClubs();
        } catch (e) { console.error(e); }
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

    const getLevelColor = (level) => {
        if (level === 'platinum') return '#E5E4E2'; // Platinum silver/white
        if (level === 'premium') return '#FFD700'; // Gold
        return '#39ff14'; // Green
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px', color: '#fff' }}>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '30px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#39ff14', letterSpacing: '3px' }}>NETWORK SCALE</span>
                            <h1 style={{ fontSize: '60px', margin: '10px 0', fontWeight: '900' }}>{clubs.length}</h1>
                            <p style={{ opacity: 0.5 }}>Onayn Klublar Tarmog'i</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>STAFF</span>
                                <h2 style={{ fontSize: '24px' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>USERS</span>
                                <h2 style={{ fontSize: '24px' }}>1.2K+</h2>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div key="clubs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '30px' }}>
                        {/* 🆕 ADD CLUB FORM */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '25px', borderRadius: '30px' }}>
                            <h3 style={{ margin: '0 0 20px', color: '#39ff14' }}>KLUB QO'SHISH</h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium 💎</option>
                                        <option value="platinum">Platinum 👑</option>
                                    </select>
                                    <input type="number" placeholder="Ustunlik (0-100)" value={clubForm.priority} onChange={e => setClubForm({ ...clubForm, priority: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                </div>
                                <input type="file" accept="image/*" onChange={e => setSelectedImage(e.target.files[0])} style={{ color: '#aaa', fontSize: '12px' }} />
                                <button onClick={handleAddClub} style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}>QO'SHISH 🔥</button>
                            </div>
                        </div>

                        {/* 📜 CLUBS LIST */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {clubs.map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: club.status === 'blocked' ? 'rgba(255,0,0,0.05)' : 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', border: club.status === 'blocked' ? '1px solid #ff444433' : '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#39ff1411', marginRight: '20px', overflow: 'hidden' }}>
                                        {club.image ? <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏛️'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h4 style={{ margin: 0 }}>{club.name}</h4>
                                            <span style={{ fontSize: '8px', padding: '3px 8px', borderRadius: '5px', background: getLevelColor(club.level) + '22', color: getLevelColor(club.level), fontWeight: 'bold' }}>{club.level.toUpperCase()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '11px', opacity: 0.4 }}>{club.address}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => toggleClubStatus(club)} style={{ background: club.status === 'active' ? '#39ff1422' : '#ff444422', border: 'none', padding: '8px 12px', borderRadius: '10px', color: club.status === 'active' ? '#39ff14' : '#ff4444', fontSize: '10px' }}>
                                            {club.status === 'active' ? 'BLOCK 🛡️' : 'UNBLOCK ✅'}
                                        </button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '10px' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div key="managers" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'grid', gap: '25px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ margin: '0 0 20px', color: '#39ff14' }}>YANGI MENEJER</h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Username" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input type="password" placeholder="Password" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="">Klubni tanlang...</option>
                                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={handleAddManager} style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', color: '#000' }}>TAYINLASH 👤</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
