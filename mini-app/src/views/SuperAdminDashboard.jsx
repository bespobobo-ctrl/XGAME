import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [clubForm, setClubForm] = useState({ name: '', address: '' });
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

            const res = await fetch(`https://long-showing-released-instructor.trycloudflare.com/api/admin/clubs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert('Klub qo\'shildi! ✅');
                setClubForm({ name: '', address: '' });
                setSelectedImage(null);
                fetchClubs();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '20px', paddingBottom: '120px' }}>

            {/* 🛰️ SECTION 1: DASHBOARD STATS */}
            {activeTab === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '2px' }}>JAMI KLUBLAR</span>
                        <h2 style={{ fontSize: '36px', margin: '5px 0' }}>{clubs.length}</h2>
                    </div>
                    <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '25px', borderRadius: '25px', textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '2px' }}>MENEJERLAR</span>
                        <h2 style={{ fontSize: '36px', margin: '5px 0' }}>{managers.length}</h2>
                    </div>
                </div>
            )}

            {/* 🏛️ SECTION 2: CLUBS MANAGEMENT */}
            {activeTab === 'clubs' && (
                <div style={{ display: 'grid', gap: '30px' }}>

                    {/* 🆕 ADD CLUB CARD (PREMIUM DESIGN) */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(57, 255, 20, 0.3)', padding: '25px', borderRadius: '30px' }}>
                        <h3 style={{ margin: '0 0 20px', color: '#39ff14' }}>YANGI KLUB QO'SHISH</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <input
                                placeholder="Klub nomi" value={clubForm.name}
                                onChange={e => setClubForm({ ...clubForm, name: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}
                            />
                            <input
                                placeholder="Manzil (Masalan: Toshkent, Chilonzor)" value={clubForm.address}
                                onChange={e => setClubForm({ ...clubForm, address: e.target.value })}
                                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff' }}
                            />

                            {/* 📸 IMAGE UPLOAD FIELD */}
                            <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px dashed #39ff14', padding: '15px', borderRadius: '15px', textAlign: 'center', cursor: 'pointer' }}>
                                <label style={{ cursor: 'pointer', display: 'block' }}>
                                    {selectedImage ? `Rasm tanlandi: ${selectedImage.name}` : '🖼️ KLUB RASMINI TANLASH (.jpg, .png)'}
                                    <input
                                        type="file" accept="image/*" hidden
                                        onChange={e => setSelectedImage(e.target.files[0])}
                                    />
                                </label>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddClub} disabled={loading}
                                style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}
                            >
                                {loading ? 'YUKLANMOQDA...' : 'SAQLASH 🔥'}
                            </motion.button>
                        </div>
                    </div>

                    {/* 📜 CLUB LIST */}
                    <h3 style={{ margin: '0', opacity: 0.5 }}>MAVJUD KLUBLAR</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {clubs.map(club => (
                            <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#39ff1422', marginRight: '15px', overflow: 'hidden' }}>
                                    {club.image && <img src={`https://long-showing-released-instructor.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{club.name}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.5 }}>{club.address}</p>
                                </div>
                                <div style={{ color: '#39ff14', fontSize: '10px', border: '1px solid #39ff1433', padding: '5px 10px', borderRadius: '8px' }}>AKTIV</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 👤 SECTION 3: MANAGERS MANAGEMENT */}
            {activeTab === 'managers' && (
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #39ff1444', padding: '25px', borderRadius: '30px' }}>
                        <h3 style={{ margin: '0 0 15px', color: '#39ff14' }}>YANGI MENEJER</h3>
                        {/* Registration form can go here */}
                        <p style={{ opacity: 0.5, fontSize: '12px' }}>Menejerlarni klublarga biriktirish va ularning huquqlarini boshqarish.</p>
                        <button style={{ width: '100%', padding: '15px', background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', color: '#39ff14', borderRadius: '15px', fontWeight: 'bold' }}>+ MENEJER QO'SHISH</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
