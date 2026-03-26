import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { callAPI } from '../api';

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const LocationPicker = ({ onSelect }) => {
    useMapEvents({ click(e) { onSelect(e.latlng); } });
    return null;
};

const SuperAdminDashboard = ({ activeTab }) => {
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // 📝 EDITING STATE
    const [editingClub, setEditingClub] = useState(null);
    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', clubId: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs(); fetchManagers();
    }, []);

    const fetchClubs = async () => {
        const data = await callAPI('/api/admin/clubs'); setClubs(data || []);
    };
    const fetchManagers = async () => {
        const data = await callAPI('/api/admin/managers'); setManagers(data || []);
    };

    const handleSaveClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', clubForm.name);
            formData.append('address', clubForm.address);
            formData.append('level', clubForm.level);
            formData.append('lat', clubForm.lat);
            formData.append('lng', clubForm.lng);
            if (selectedImage) formData.append('image', selectedImage);

            const url = editingClub
                ? `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs/${editingClub.id}`
                : `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`;

            const res = await fetch(url, {
                method: editingClub ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const result = await res.json();
            if (result.success) {
                alert(editingClub ? 'Klub tahrirlandi! ✨' : 'Klub yaratildi! 🏗️');
                closeModal(); fetchClubs();
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const deleteClub = async (id) => {
        if (!window.confirm('O\'chirilsinmi? 🗑️')) return;
        try { await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' }); fetchClubs(); } catch (e) { console.error(e); }
    };

    const openEditModal = (club) => {
        setEditingClub(club);
        setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng });
        setIsFormOpen(true);
    };

    const closeModal = () => {
        setIsFormOpen(false); setEditingClub(null);
        setClubForm({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
        setSelectedImage(null);
    };

    const handleAddManager = async () => {
        if (!managerForm.username || !managerForm.password || !managerForm.clubId) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const res = await callAPI('/api/admin/managers', { method: 'POST', body: JSON.stringify(managerForm) });
            if (res.success) { alert('Menejer qo\'shildi! 🔥'); setManagerForm({ username: '', password: '', clubId: '' }); fetchManagers(); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff' }}>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid #39ff1444', padding: '30px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>LIVE NETWORK</span>
                            <h1 style={{ fontSize: '64px', margin: '5px 0', fontWeight: '900' }}>{clubs.length}</h1>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', borderRadius: '15px', padding: '12px', color: '#fff' }} />
                            <button onClick={() => setIsFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '50px', borderRadius: '15px', fontWeight: 'bold' }}>+</button>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '25px', border: '1px solid #fff1' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                        {club.image && <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{club.name}</h4>
                                        <p style={{ margin: 0, fontSize: '9px', opacity: 0.3 }}>{club.address}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => openEditModal(club)} style={{ background: 'none', border: 'none', color: '#39ff14', fontSize: '18px' }}>✎</button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: 'none', opacity: 0.2 }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '30px', border: '1px solid #fff2' }}>
                            <h2 style={{ margin: '0 0 15px', color: '#39ff14' }}>MENEJER TAYINLASH</h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
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

            {/* 🗺️ MODAL: SAVE/EDIT FORM */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', boxSizing: 'border-box' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: '450px', maxHeight: '95vh', overflowY: 'auto', background: '#0a0a0a', border: '1px solid #39ff1444', borderRadius: '40px', padding: '30px' }}>
                            <h2 style={{ margin: '0 0 20px', textAlign: 'center', color: '#39ff14' }}>{editingClub ? 'TAHRIRLASH ✎' : 'YANGI KLUB 🏛️'}</h2>

                            <div style={{ height: '220px', borderRadius: '25px', overflow: 'hidden', border: '1px solid #fff2', marginBottom: '20px' }}>
                                <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                    <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                </MapContainer>
                            </div>

                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />

                                <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="standard">Standard</option>
                                    <option value="premium">Premium 💎</option>
                                    <option value="platinum">Platinum 👑</option>
                                </select>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', textAlign: 'center', border: '1px dashed #fff2' }}>
                                    <label style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}>
                                        {selectedImage ? `✅ ${selectedImage.name.substring(0, 20)}` : '📷 RASMNI YANGILASH'}
                                        <input type="file" accept="image/*" hidden onChange={e => setSelectedImage(e.target.files[0])} />
                                    </label>
                                </div>

                                <button onClick={handleSaveClub} disabled={loading} style={{ background: 'linear-gradient(90deg, #39ff14, #00ddeb)', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 'bold', color: '#000', marginTop: '10px' }}>
                                    {loading ? 'SAQLANMOQDA...' : (editingClub ? 'O\'ZGARIShLARNI SAQLASh ✨' : 'KLUBNI YARATISh 🚀')}
                                </button>
                                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '12px' }}>BEKOR QILISH</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
