import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // FORMA HOLATI (GOOGLE MAPS BILAN)
    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', locationUrl: '' });
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
        if (!clubForm.name || !clubForm.address) return alert('Barcha maydonlarni to\'ldiring! 🛑');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', clubForm.name);
            formData.append('address', clubForm.address);
            formData.append('level', clubForm.level);
            formData.append('locationUrl', clubForm.locationUrl); // GOOGLE MAPS LINK
            if (selectedImage) formData.append('image', selectedImage);

            const res = await fetch(`https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert('Muvaffaqiyatli! 🏗️🔥');
                setClubForm({ name: '', address: '', level: 'standard', locationUrl: '' });
                setSelectedImage(null);
                setIsFormOpen(false);
                fetchClubs();
            }
        } catch (e) { console.error('E:', e); }
        finally { setLoading(false); }
    };

    const toggleStatus = async (club) => {
        const newStatus = club.status === 'active' ? 'blocked' : 'active';
        try {
            await callAPI(`/api/admin/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    const deleteClub = async (id) => {
        if (!window.confirm('O\'chirilsinmi? 🗑️')) return;
        try {
            await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    const handleAddManager = async () => {
        if (!managerForm.username || !managerForm.password || !managerForm.clubId) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const res = await callAPI('/api/admin/managers', {
                method: 'POST', body: JSON.stringify(managerForm)
            });
            if (res.success) {
                alert('Menejer qo\'shildi! 🔥');
                setManagerForm({ username: '', password: '', clubId: '' });
                fetchManagers();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const deleteManager = async (id) => {
        if (!window.confirm('Menejerni o\'chirmoqchimisiz? 🗑️')) return;
        try {
            await callAPI(`/api/admin/managers/${id}`, { method: 'DELETE' });
            fetchManagers();
        } catch (e) { console.error(e); }
    }

    const filteredClubs = clubs.filter(club => {
        const matchesSearch = (club.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'all' || club.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', boxSizing: 'border-box' }}>

            <AnimatePresence mode="wait">
                {/* 📊 BO'LIM 1: STATISTIKA */}
                {activeTab === 'dashboard' && (
                    <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid #39ff1444', padding: '30px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>NETWORK SCALE</span>
                            <h1 style={{ fontSize: '64px', margin: '5px 0', fontWeight: '900' }}>{clubs.length}</h1>
                            <p style={{ opacity: 0.4, fontSize: '12px' }}>Aktiv O'yin Klublari</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ opacity: 0.5, fontSize: '10px' }}>MANAGERS</span>
                                <h2 style={{ fontSize: '32px', margin: '5px 0' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ opacity: 0.5, fontSize: '10px' }}>LOAD</span>
                                <h2 style={{ fontSize: '32px', margin: '5px 0' }}>72% ✨</h2>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(30,144,255,0.05)', border: '1px solid #1e90ff44', padding: '20px', borderRadius: '25px' }}>
                            <h3 style={{ fontSize: '12px', opacity: 0.4 }}>GLOBAL MESSAGE</h3>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input placeholder="Barcha klublarga xabar..." style={{ background: '#000', border: '1px solid #fff2', padding: '12px', borderRadius: '12px', flex: 1, color: '#fff' }} />
                                <button style={{ background: '#1e90ff', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold' }}>📡</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 🏛️ BO'LIM 2: KLUBLAR BOShQARUVI */}
                {activeTab === 'clubs' && (
                    <motion.div key="clubs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', borderRadius: '15px', padding: '12px', color: '#fff' }}
                            />
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '50px', borderRadius: '15px', fontSize: '20px' }}>+</motion.button>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {filteredClubs.map(club => (
                                <motion.div layout key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', border: '1px solid #fff1' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                        {club.image && <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{club.name}</h4>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <span style={{ fontSize: '7px', color: '#39ff14' }}>{club.level.toUpperCase()}</span>
                                            {club.locationUrl && <a href={club.locationUrl} target="_blank" style={{ fontSize: '7px', color: '#1e90ff' }}>📍 MAPS</a>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => toggleStatus(club)} style={{ background: 'none', border: 'none', color: club.status === 'active' ? '#39ff14' : '#ff4444' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: 'none', opacity: 0.2 }}>🗑️</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 👤 BO'LIM 3: MENEJERLAR BOShQARUVI (QAYTA TIKLANDI!) */}
                {activeTab === 'managers' && (
                    <motion.div key="managers" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'grid', gap: '25px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', padding: '30px', borderRadius: '35px' }}>
                            <h2 style={{ margin: '0 0 20px', color: '#39ff14' }}>MENEJER TAYINLASH</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Username" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input type="password" placeholder="Password" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="">Klubni tanlang...</option>
                                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={handleAddManager} style={{ background: '#39ff14', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 'bold', color: '#000' }}>LOGIN YARATISH 👤</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {managers.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px 25px', borderRadius: '20px' }}>
                                    <div>
                                        <h5 style={{ margin: 0 }}>{m.username}</h5>
                                        <p style={{ margin: 0, fontSize: '9px', opacity: 0.3 }}>Klub ID: {m.ClubId}</p>
                                    </div>
                                    <button onClick={() => deleteManager(m.id)} style={{ background: 'none', border: 'none', color: '#ff4444', opacity: 0.5 }}>🗑️</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 💎 MODAL: YANGI KLUB (GOOGE MAPS LINK BILAN) */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: '380px', background: '#0a0a0a', border: '1px solid #39ff1444', borderRadius: '35px', padding: '30px' }}>
                            <h2 style={{ margin: '0 0 20px', textAlign: 'center', color: '#39ff14' }}>YANGI KLUB 🏛️</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />

                                <div style={{ display: 'grid', gap: '5px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, marginLeft: '5px' }}>🌍 GOOGLE MAPS LINK (Haqiqiy koordinata)</label>
                                    <input placeholder="https://maps.google.com/..." value={clubForm.locationUrl} onChange={e => setClubForm({ ...clubForm, locationUrl: e.target.value })} style={{ background: '#111', border: '1px solid #1e90ff44', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                </div>

                                <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium 💎</option>
                                    <option value="platinum">Platinum 👑</option>
                                </select>

                                <input type="file" accept="image/*" onChange={e => setSelectedImage(e.target.files[0])} style={{ fontSize: '12px', opacity: 0.5 }} />

                                <button onClick={handleAddClub} disabled={loading} style={{ background: '#39ff14', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 'bold', color: '#000', marginTop: '10px' }}>
                                    {loading ? 'YUKLANMOQDA...' : 'KLUB YARATISH 🚀'}
                                </button>
                                <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '11px' }}>BEKOR QILISH</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
