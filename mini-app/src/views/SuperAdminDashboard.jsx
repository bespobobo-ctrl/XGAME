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
        if (!clubForm.name || !clubForm.address) return alert('Barcha maydonlarni to\'ldiring! 🏢');
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
                alert('Muvaffaqiyatli: Yangi o\'yin markazi ishga tushdi! 🚀🔥');
                setClubForm({ name: '', address: '', level: 'standard', priority: 0 });
                setSelectedImage(null);
                setIsFormOpen(false);
                fetchClubs();
            } else {
                alert(result.error || 'Xatolik yuz berdi! 🚫');
            }
        } catch (e) {
            console.error('E:', e);
            alert('Ro\'xsat yo\'q yoki aloqa yo\'q! (Log out qilib qayta kiring) 🛡️');
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
        if (!window.confirm('Haqiqatan ham daxshatli o\'chirilsinmi? 🗑️')) return;
        try {
            await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' });
            fetchClubs();
        } catch (e) { console.error(e); }
    };

    const getLvlClr = (l) => l === 'platinum' ? '#fff' : (l === 'premium' ? '#ffd700' : '#39ff14');

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px', minHeight: '100vh', background: '#000' }}>

            {/* 🪐 SECTION: STATS HEADER */}
            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'linear-gradient(135deg, rgba(57,255,20,0.1), rgba(0,0,0,0.5))', border: '1px solid #39ff1444', padding: '35px', borderRadius: '35px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: '#39ff14', filter: 'blur(70px)', opacity: 0.1 }} />
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px', fontWeight: 'bold' }}>NEXUS NETWORK</span>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginTop: '15px' }}>
                                <h1 style={{ fontSize: '72px', margin: 0, fontWeight: '900', lineHeight: 1, textShadow: '0 0 20px #39ff1433' }}>{clubs.length}</h1>
                                <div style={{ fontSize: '14px', opacity: 0.4, marginBottom: '10px' }}>Active Nodes</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff1', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>MANAGERS</div>
                                <h2 style={{ fontSize: '32px', margin: '5px 0', color: '#39ff14' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff1', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>USERS</div>
                                <h2 style={{ fontSize: '32px', margin: '5px 0', color: '#00ddeb' }}>1.2K</h2>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 🏛️ SECTION: CLUBS LIST */}
                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '25px' }}>

                        {/* 🧩 PREMIUM SEARCH & ADD HEADER */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', borderRadius: '20px', padding: '15px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>🔍</span>
                                <input
                                    placeholder="Search nodes..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', flex: 1 }}
                                />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }} onClick={() => setIsFormOpen(true)}
                                style={{ background: '#39ff14', border: 'none', width: '55px', height: '55px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}
                            >+</motion.button>
                        </div>

                        <div style={{ display: 'grid', gap: '15px' }}>
                            {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                                <motion.div
                                    layout key={club.id}
                                    style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '30px', border: club.status === 'blocked' ? '1px solid #ff444444' : '1px solid #fff1' }}
                                >
                                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#39ff1411', marginRight: '20px', overflow: 'hidden', border: '1px solid #ffffff05' }}>
                                        {club.image ? <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px', display: 'block', textAlign: 'center', marginTop: '12px' }}>🏛️</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{club.name}</h4>
                                            <span style={{ fontSize: '7px', background: getLvlClr(club.level) + '22', color: getLvlClr(club.level), padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', border: `1px solid ${getLvlClr(club.level)}33` }}>{club.level.toUpperCase()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '11px', opacity: 0.4 }}>{club.address}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => toggleStatus(club)} style={{ background: 'none', border: 'none', padding: '10px', fontSize: '18px', color: club.status === 'active' ? '#39ff14' : '#ff4444' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: 'none', padding: '10px', fontSize: '18px', opacity: 0.3 }}>🗑️</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 💎 SECTION: THE ULTRA-PREMIUM MODAL FORM */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{ width: '100%', maxWidth: '400px', background: '#0a0a0a', border: '1px solid #39ff1433', borderRadius: '40px', padding: '35px', boxShadow: '0 0 50px #39ff1411' }}
                        >
                            <h2 style={{ margin: '0 0 25px', textAlign: 'center', color: '#39ff14', fontSize: '24px', letterSpacing: '1px' }}>YANGI KLUB 🏛️</h2>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, paddingLeft: '10px' }}>KLUB NOMI</label>
                                    <input placeholder="Masalan: NEXUS Arena" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', padding: '18px', borderRadius: '18px', color: '#fff' }} />
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, paddingLeft: '10px' }}>MANZIL</label>
                                    <input placeholder="Shaharni kiriting..." value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', padding: '18px', borderRadius: '18px', color: '#fff' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '10px', opacity: 0.4, paddingLeft: '10px' }}>TURI (LVL)</label>
                                        <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '18px', borderRadius: '18px', color: '#fff' }}>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium 💎</option>
                                            <option value="platinum">Platinum 👑</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        <label style={{ fontSize: '10px', opacity: 0.4, paddingLeft: '10px' }}>USTUNLIK</label>
                                        <input type="number" value={clubForm.priority} onChange={e => setClubForm({ ...clubForm, priority: e.target.value })} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', padding: '18px', borderRadius: '18px', color: '#fff' }} />
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '18px', border: '1px dashed #fff3' }}>
                                    <label style={{ cursor: 'pointer', display: 'block', textAlign: 'center', fontSize: '12px', opacity: 0.5 }}>
                                        {selectedImage ? `✅ ${selectedImage.name.substring(0, 15)}...` : '📸 RASM YUKLASh (Daxshatli)'}
                                        <input type="file" accept="image/*" hidden onChange={e => setSelectedImage(e.target.files[0])} />
                                    </label>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }} onClick={handleAddClub} disabled={loading}
                                    style={{ background: 'linear-gradient(45deg, #39ff14, #00ddeb)', border: 'none', padding: '22px', borderRadius: '22px', fontWeight: '900', color: '#000', marginTop: '10px', boxShadow: '0 10px 30px #39ff1433' }}
                                >
                                    {loading ? 'YARATILMOQDA...' : 'KLUB YARATISH 🏗️🔥'}
                                </motion.button>

                                <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>BEKOR QILISH</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
