import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', priority: 0 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', clubId: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs();
        fetchManagers();
    }, []);

    const fetchClubs = async () => {
        try { const data = await callAPI('/api/admin/clubs'); setClubs(data || []); } catch (e) { console.error(e); }
    };
    const fetchManagers = async () => {
        try { const data = await callAPI('/api/admin/managers'); setManagers(data || []); } catch (e) { console.error(e); }
    };

    const handleAddClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('Barcha maydonlarni kiriting! 🛑');
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

            if (res.status === 401) {
                alert('Ro\'xsat yo\'q! (Login/Parolni qaytadan kiriting). 🛡️');
                return;
            }

            const result = await res.json();
            if (result.success) {
                alert('Muvaffaqiyatli! 🏗️🔥');
                setClubForm({ name: '', address: '', level: 'standard', priority: 0 });
                setSelectedImage(null);
                setIsFormOpen(false);
                fetchClubs();
            } else {
                alert(result.error || 'Serverda xato!');
            }
        } catch (e) {
            console.error('API Error:', e);
            alert('Aloqa yoki ruxsatda xatolik! ❌');
        } finally { setLoading(false); }
    };

    const toggleStatus = async (club) => {
        const newStatus = club.status === 'active' ? 'blocked' : 'active';
        try {
            await callAPI(`/api/admin/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    const deleteClub = async (id) => {
        if (!window.confirm('Haram bo\'lishi aniq o\'chirilsinmi? 🗑️')) return;
        try {
            await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', boxSizing: 'border-box' }}>

            {/* 🛰️ HEADER STATS */}
            <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '25px', borderRadius: '30px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-10px', fontSize: '60px', opacity: 0.05 }}>🛸</div>
                <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '3px', fontWeight: '800' }}>NEXUS CENTER</span>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <h1 style={{ fontSize: '50px', margin: 0, fontWeight: '900', lineHeight: 1 }}>{clubs.length}</h1>
                    <span style={{ opacity: 0.4, fontSize: '12px', marginBottom: '5px' }}>Nodes Online</span>
                </div>
            </div>

            {/* 🔍 ACTIONS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #fff1', borderRadius: '15px', padding: '12px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5, marginRight: '8px' }}>🔍</span>
                    <input
                        placeholder="Search nodes..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '13px' }}
                    />
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }} onClick={() => setIsFormOpen(true)}
                    style={{ background: '#39ff14', border: 'none', width: '45px', height: '45px', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold' }}
                >+</motion.button>
            </div>

            {/* 📜 CLUBS LIST */}
            <AnimatePresence>
                <div style={{ display: 'grid', gap: '12px' }}>
                    {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                        <motion.div
                            layout key={club.id}
                            style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', border: club.status === 'blocked' ? '1px solid #ff444433' : '1px solid #ffffff08' }}
                        >
                            <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                {club.image ? <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏛️'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <h4 style={{ margin: 0, fontSize: '15px' }}>{club.name}</h4>
                                    <span style={{ fontSize: '6px', padding: '1px 4px', border: '1px solid #fff3', borderRadius: '3px', color: '#fff5' }}>{club.level.toUpperCase()}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '10px', opacity: 0.3 }}>{club.address}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => toggleStatus(club)} style={{ background: 'none', border: 'none', fontSize: '16px', color: club.status === 'active' ? '#39ff14' : '#ff4444' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: 'none', fontSize: '14px', opacity: 0.2 }}>🗑️</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>

            {/* 💎 THE IMPROVED MODAL (RESPONSIVE) */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', boxSizing: 'border-box' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            style={{ width: '100%', maxWidth: '360px', background: '#0a0a0a', border: '1px solid #39ff1444', borderRadius: '30px', padding: '25px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        >
                            <h2 style={{ margin: '0 0 20px', textAlign: 'center', fontSize: '20px', color: '#39ff14' }}>NEW NODE 🏗️</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div style={{ display: 'grid', gap: '5px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, marginLeft: '10px' }}>KLUB NOMI</label>
                                    <input placeholder="Nexus Park" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: '#111', border: '1px solid #fff1', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'grid', gap: '5px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, marginLeft: '10px' }}>MANZIL</label>
                                    <input placeholder="Toshkent sh." value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: '#111', border: '1px solid #fff1', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '13px', width: '100%', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ display: 'grid', gap: '5px' }}>
                                        <label style={{ fontSize: '10px', opacity: 0.4, marginLeft: '10px' }}>LEVEL</label>
                                        <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#000', border: '1px solid #fff1', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '12px' }}>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium 💎</option>
                                            <option value="platinum">Platinum 👑</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: '5px' }}>
                                        <label style={{ fontSize: '10px', opacity: 0.4, marginLeft: '10px' }}>PRIORITY</label>
                                        <input type="number" value={clubForm.priority} onChange={e => setClubForm({ ...clubForm, priority: e.target.value })} style={{ background: '#111', border: '1px solid #fff1', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px dashed #fff2', textAlign: 'center' }}>
                                    <label style={{ cursor: 'pointer', fontSize: '11px', opacity: 0.5 }}>
                                        {selectedImage ? `✅ ${selectedImage.name.substring(0, 15)}` : '📷 RASM TANLASH'}
                                        <input type="file" accept="image/*" hidden onChange={e => setSelectedImage(e.target.files[0])} />
                                    </label>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }} onClick={handleAddClub} disabled={loading}
                                    style={{ background: 'linear-gradient(90deg, #39ff14, #00ddeb)', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: '900', color: '#000', marginTop: '5px' }}
                                >
                                    {loading ? 'WAIT...' : 'INITIALIZE NODE 🚀'}
                                </motion.button>

                                <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '11px', fontWeight: 'bold' }}>CANCEL</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
