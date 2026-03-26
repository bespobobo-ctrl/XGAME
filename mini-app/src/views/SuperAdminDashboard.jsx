import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [isFormOpen, setIsFormOpen] = useState(false); // FORMA UCHUN YANGI HOLAT
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

            // 🛰️ DIRECT LINK CHECK
            const res = await fetch(`https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert('Klub yaratildi! 🔥');
                setClubForm({ name: '', address: '', level: 'standard', priority: 0 });
                setSelectedImage(null);
                setIsFormOpen(false); // Formani yopish
                fetchClubs(); // LISTNI YANGILASH
            } else {
                alert(result.error || 'Server xatosi!');
            }
        } catch (e) { console.error('E:', e); alert('Tizim bilan aloqa uzildi!'); }
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
        if (!window.confirm('Haqiqatan ham o\'chirmoqchimisiz? 🗑️')) return;
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

    const filteredClubs = clubs.filter(club => {
        const matchesSearch = (club.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'all' || club.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px', color: '#fff' }}>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '25px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '3px' }}>NETWORK SCALE</span>
                            <h1 style={{ fontSize: '50px', margin: '5px 0' }}>{clubs.length}</h1>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ opacity: 0.5, fontSize: '10px' }}>STAFF</span>
                                <h2>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ opacity: 0.5, fontSize: '10px' }}>USERS</span>
                                <h2>1.2K+</h2>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div key="clubs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>

                        {/* 🔍 SEARCH & FILTER */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '12px', color: '#fff' }}
                            />
                            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ background: '#000', border: '1px solid #fff2', color: '#fff', borderRadius: '15px', padding: '10px' }}>
                                <option value="all">Hammasi</option>
                                <option value="platinum">Platinum</option>
                                <option value="premium">Premium</option>
                                <option value="standard">Standard</option>
                            </select>
                        </div>

                        {/* 🆕 NEW CLUB BUTTON */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFormOpen(!isFormOpen)}
                            style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff1488', padding: '15px', borderRadius: '15px', color: '#39ff14', fontWeight: 'bold' }}
                        >
                            {isFormOpen ? '✖ BEKOR QILISH' : '+ YANGI KLUB QO\'SHISH'}
                        </motion.button>

                        <AnimatePresence>
                            {isFormOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden', display: 'grid', gap: '12px', background: 'rgba(57, 255, 20, 0.05)', padding: '20px', borderRadius: '25px', border: '1px dashed #39ff1444' }}
                                >
                                    <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                    <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium 💎</option>
                                            <option value="platinum">Platinum 👑</option>
                                        </select>
                                        <input type="number" placeholder="Priority" value={clubForm.priority} onChange={e => setClubForm({ ...clubForm, priority: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '5px' }}>RASM YUKLASH (JPG/PNG):</div>
                                    <input type="file" accept="image/*" onChange={e => setSelectedImage(e.target.files[0])} style={{ color: '#aaa', fontSize: '12px' }} />
                                    <button onClick={handleAddClub} disabled={loading} style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: 'bold', color: '#000', marginTop: '10px' }}>
                                        {loading ? 'YUKLANMOQDA...' : 'TASDIQLASH 🚀'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 📜 LIST */}
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {filteredClubs.map(club => (
                                <motion.div layout key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                        {club.image && <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '15px' }}>{club.name}</h4>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <span style={{ fontSize: '7px', color: '#39ff14' }}>{club.level.toUpperCase()}</span>
                                            <span style={{ fontSize: '7px', opacity: 0.3 }}>| {club.status.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => toggleClubStatus(club)} style={{ background: 'none', border: '1px solid #ffffff22', padding: '8px', borderRadius: '10px', fontSize: '10px' }}>🛡️</button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: '1px solid #ff444433', padding: '8px', borderRadius: '10px', fontSize: '10px' }}>🗑️</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div key="managers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '30px', border: '1px solid #fff1' }}>
                            <h3 style={{ margin: '0 0 15px', color: '#39ff14' }}>MENEJER TAYINLASH</h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input type="password" placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
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
