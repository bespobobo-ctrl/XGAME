import React, { useState, useEffect } from 'react';
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
    const [lang, setLang] = useState('uz');
    const [stats, setStats] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [isClubFormOpen, setIsClubFormOpen] = useState(false);
    const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);
    const [editingManager, setEditingManager] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', status: 'active', clubId: '' });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const cData = await callAPI('/api/admin/clubs'); setClubs(cData || []);
                const mData = await callAPI('/api/admin/managers'); setManagers(mData || []);
                const sData = await callAPI('/api/admin/stats'); if (sData) setStats(sData);
            } catch (e) { console.error("Data load error", e); }
        };
        loadInitialData();
        const interval = setInterval(async () => {
            try {
                const sData = await callAPI('/api/admin/stats'); if (sData) setStats(sData);
            } catch (e) { }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('To\'ldiring');
        try {
            const res = await callAPI(editingClub ? `/api/admin/clubs/${editingClub.id}` : '/api/admin/clubs', {
                method: editingClub ? 'PUT' : 'POST', body: JSON.stringify(clubForm)
            });
            if (res.success) { setIsClubFormOpen(false); setEditingClub(null); const cData = await callAPI('/api/admin/clubs'); setClubs(cData || []); }
        } catch (e) { }
    };

    const handleSaveManager = async () => {
        if (!managerForm.username || (!editingManager && !managerForm.password) || !managerForm.clubId) return alert('To\'ldiring');
        try {
            const res = await callAPI(editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers', {
                method: editingManager ? 'PUT' : 'POST', body: JSON.stringify(managerForm)
            });
            if (res.success) { setIsManagerFormOpen(false); setEditingManager(null); const mData = await callAPI('/api/admin/managers'); setManagers(mData || []); }
        } catch (e) { }
    };

    return (
        <div style={{ background: '#000', minHeight: '100vh', color: '#fff', padding: '15px', boxSizing: 'border-box' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setLang('uz')} style={{ padding: '6px 12px', background: lang === 'uz' ? '#39ff14' : '#222', border: 'none', color: lang === 'uz' ? '#000' : '#fff', borderRadius: '8px', fontSize: '10px' }}>UZ</button>
                <button onClick={() => setLang('ru')} style={{ padding: '6px 12px', background: lang === 'ru' ? '#39ff14' : '#222', border: 'none', color: lang === 'ru' ? '#000' : '#fff', borderRadius: '8px', fontSize: '10px' }}>RU</button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {stats ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ background: '#111', padding: '30px', borderRadius: '25px', textAlign: 'center', border: '1px solid #333' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', opacity: 0.6 }}>UMUMIY KLUBLAR</span>
                                    <h1 style={{ fontSize: '60px', margin: '10px 0' }}>{stats.totalClubs || 0}</h1>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                                        <span style={{ fontSize: '8px', opacity: 0.5 }}>BUGUNGI DAROMAD</span>
                                        <h3 style={{ margin: '5px 0' }}>{(stats.todayRevenue || 0).toLocaleString()}</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222' }}>
                                        <span style={{ fontSize: '8px', opacity: 0.5 }}>AKTIV O'YINCHILAR</span>
                                        <h3 style={{ margin: '5px 0' }}>{stats.activeUsers || 0} 🟢</h3>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '50px' }}>Yuklanmoqda... 🛰️</div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div key="clubs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input placeholder="Qidiruv..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '12px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold' }}>+ KLUB</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(clubs || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                                <div key={c.id} style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{c.name}</span>
                                    <button onClick={() => { setEditingClub(c); setClubForm({ name: c.name, address: c.address || '', level: c.level || 'standard', lat: c.lat || 41.2995, lng: c.lng || 69.2401 }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none' }}>✎</button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div key="managers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ width: '100%', padding: '15px', background: '#39ff1411', border: '1px solid #39ff1444', borderRadius: '15px', color: '#39ff14', marginBottom: '15px' }}>+ MENEJER QO'SHISH</button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(managers || []).map(m => (
                                <div key={m.id} style={{ background: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #222' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <b>{m.username}</b>
                                        <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none' }}>✎</button>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#39ff14', marginTop: '10px' }}>🔑 {m.rawPassword || '---'}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS WITHOUT BLUR FOR MAXIMUM STABILITY */}
            {isClubFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '400px', background: '#111', borderRadius: '25px', padding: '25px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>KLUB MA'LUMOTI</h3>
                        <div style={{ height: '200px', borderRadius: '15px', overflow: 'hidden', marginBottom: '15px' }}>
                            <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                            </MapContainer>
                        </div>
                        <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} />
                        <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>SAQLASH</button>
                        <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>BEKOR QILISH</button>
                    </div>
                </div>
            )}

            {isManagerFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '350px', background: '#111', borderRadius: '25px', padding: '25px', border: '1px solid #333' }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>MENEJER</h3>
                        <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <input type="text" placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '15px' }}>
                            <option value="">Klub...</option>
                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={handleSaveManager} style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>OK</button>
                        <button onClick={() => setIsManagerFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>BEKOR QILISH</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
