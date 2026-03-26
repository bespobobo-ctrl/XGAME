import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
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
        if (!window.confirm('Haqiqatan ham o\'chirilsinmi? 🗑️')) return;
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

    // 🔍 SEARCH & FILTER LOGIC
    const filteredClubs = clubs.filter(club => {
        const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) || club.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === 'all' || club.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getLevelColor = (level) => {
        if (level === 'platinum') return '#E5E4E2'; // Platinum
        if (level === 'premium') return '#FFD700'; // Gold
        return '#39ff14'; // Green
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px', color: '#fff' }}>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '30px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>LIVE NETWORK SCALE</span>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                <h1 style={{ fontSize: '70px', margin: 0, fontWeight: '900' }}>{clubs.length}</h1>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: '#39ff14', fontSize: '12px' }}>● ONLINE</div>
                                    <div style={{ opacity: 0.5, fontSize: '12px' }}>{clubs.length} TOTAL</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>ACTIVE STAFF</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,251,0.02)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', opacity: 0.5 }}>AVG. LOAD</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>72%</h2>
                            </div>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <h3 style={{ fontSize: '12px', opacity: 0.3, letterSpacing: '2px', marginBottom: '15px' }}>GLOBAL ANNOUNCEMENT</h3>
                            <div style={{ background: 'rgba(30,144,255,0.1)', border: '1px solid rgba(30,144,255,0.3)', padding: '15px', borderRadius: '20px', display: 'flex', alignItems: 'center' }}>
                                <input placeholder="Barcha klublarga xabar yuborish..." style={{ background: 'none', border: 'none', color: '#fff', flex: 1, outline: 'none' }} />
                                <button style={{ background: '#1e90ff', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>YUBORISH</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div key="clubs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '25px' }}>

                        {/* 🔍 SEARCH & FILTER BAR */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '10px 15px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>🔍</span>
                                <input
                                    placeholder="Search clubs..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
                                />
                            </div>
                            <select
                                value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '10px', color: '#fff', fontSize: '12px' }}
                            >
                                <option value="all">Hammasi</option>
                                <option value="platinum">Platinum 👑</option>
                                <option value="premium">Premium 💎</option>
                                <option value="standard">Standard 🎮</option>
                            </select>
                        </div>

                        {/* 🆕 ADD NEW CLUB (Expandable UI) */}
                        <details style={{ background: 'rgba(57, 255, 20, 0.03)', border: '1px dashed rgba(57, 255, 20, 0.3)', padding: '20px', borderRadius: '25px' }}>
                            <summary style={{ cursor: 'pointer', color: '#39ff14', fontWeight: 'bold', fontSize: '14px' }}>+ YANGI KLUB QO'SHISH</summary>
                            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                                <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input placeholder="Manzili" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium 💎</option>
                                        <option value="platinum">Platinum 👑</option>
                                    </select>
                                    <input type="number" placeholder="Priority" value={clubForm.priority} onChange={e => setClubForm({ ...clubForm, priority: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                </div>
                                <input type="file" accept="image/*" onChange={e => setSelectedImage(e.target.files[0])} style={{ fontSize: '12px', opacity: 0.5 }} />
                                <button onClick={handleAddClub} style={{ background: '#39ff14', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', color: '#000' }}>TASDIQLASH 🚀</button>
                            </div>
                        </details>

                        {/* 📜 CLUBS LIST (Dynamic Filtered) */}
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {filteredClubs.map(club => (
                                <motion.div
                                    key={club.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ display: 'flex', alignItems: 'center', background: club.status === 'blocked' ? 'rgba(255,0,0,0.05)' : 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <div style={{ width: '55px', height: '55px', borderRadius: '12px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                        {club.image ? <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏛️'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px' }}>{club.name}</h4>
                                            <span style={{ fontSize: '7px', padding: '2px 6px', borderRadius: '4px', background: getLevelColor(club.level) + '33', color: getLevelColor(club.level), fontWeight: 'bold' }}>{club.level.toUpperCase()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '10px', opacity: 0.4 }}>{club.address}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => toggleClubStatus(club)} style={{ background: club.status === 'active' ? '#39ff1411' : '#ff444411', border: 'none', padding: '10px', borderRadius: '12px', color: club.status === 'active' ? '#39ff14' : '#ff4444' }}>
                                            {club.status === 'active' ? '🛡️' : '🔓'}
                                        </button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', padding: '10px', borderRadius: '12px' }}>🗑️</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div key="managers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: '0 0 20px', color: '#39ff14' }}>NEW MANAGER</h3>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input type="password" placeholder="Password" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="">Klubni tanlang...</option>
                                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={handleAddManager} style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', color: '#000' }}>LOGIN YARATISH 👤</button>
                            </div>
                        </div>

                        {/* LIST OF MANAGERS */}
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {managers.map(m => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39ff14' }}></div>
                                        <span>{m.username}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', opacity: 0.3 }}>ID: #{m.id}</span>
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
