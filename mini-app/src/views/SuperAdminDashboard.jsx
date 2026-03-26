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
    const [searchTerm, setSearchTerm] = useState('');

    const [isClubFormOpen, setIsClubFormOpen] = useState(false);
    const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);
    const [editingManager, setEditingManager] = useState(null);

    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', status: 'active', clubId: '' });

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [c, m, s] = await Promise.all([
                    callAPI('/api/admin/clubs'),
                    callAPI('/api/admin/managers'),
                    callAPI('/api/admin/stats')
                ]);
                setClubs(c || []); setManagers(m || []); if (s) setStats(s);
            } catch (e) { console.error("Poll Error", e); }
        };
        loadAll();
        const timer = setInterval(async () => {
            const s = await callAPI('/api/admin/stats'); if (s) setStats(s);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const handleSaveClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('Input error');
        const res = await callAPI(editingClub ? `/api/admin/clubs/${editingClub.id}` : '/api/admin/clubs', {
            method: editingClub ? 'PUT' : 'POST', body: JSON.stringify(clubForm)
        });
        if (res.success) { setIsClubFormOpen(false); setEditingClub(null); callAPI('/api/admin/clubs').then(setClubs); }
    };

    const handleSaveManager = async () => {
        if (!managerForm.username || (!editingManager && !managerForm.password) || !managerForm.clubId) return alert('Input error');
        const res = await callAPI(editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers', {
            method: editingManager ? 'PUT' : 'POST', body: JSON.stringify(managerForm)
        });
        if (res.success) { setIsManagerFormOpen(false); setEditingManager(null); callAPI('/api/admin/managers').then(setManagers); }
    };

    const toggleManagerStatus = async (m) => {
        const newS = m.status === 'active' ? 'blocked' : 'active';
        await callAPI(`/api/admin/managers/${m.id}`, { method: 'PUT', body: JSON.stringify({ status: newS }) });
        callAPI('/api/admin/managers').then(setManagers);
    };

    return (
        <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                {['uz', 'ru'].map(l => <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? '#39ff14' : '#111', color: lang === l ? '#000' : '#fff', border: 'none', padding: '6px 15px', borderRadius: '10px', fontSize: '10px' }}>{l.toUpperCase()}</button>)}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {stats ? (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <div style={{ background: '#111', padding: '40px 20px', borderRadius: '30px', textAlign: 'center', border: '1px solid #333' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>UMUMIY KLUBLAR</span>
                                    <h1 style={{ fontSize: '70px', margin: '5px 0' }}>{stats.totalClubs || 0}</h1>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                        <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>BUGUNGI DAROMAD</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{(stats.todayRevenue || 0).toLocaleString()} 📈</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                        <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>AKTIV O'YINCHILAR</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{stats.activeUsers || 0} 🟢</h3>
                                    </div>
                                </div>
                                {/* TIMELINE RESTORED (SAFE) */}
                                <div style={{ background: '#080808', padding: '25px', borderRadius: '30px', border: '1px dashed #333' }}>
                                    <h4 style={{ fontSize: '10px', opacity: 0.4, marginBottom: '15px' }}>KLUBLAR TARIXI (REG)</h4>
                                    {(stats.clubsHistory || []).map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a', fontSize: '11px' }}>
                                            <b style={{ color: '#39ff14' }}>{c.name}</b>
                                            <span style={{ opacity: 0.4 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <div style={{ textAlign: 'center', padding: '80px' }}>Loading Stats... 🛰️</div>}
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input placeholder="Qidiruv..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '60px', borderRadius: '15px', color: '#000', fontWeight: 'bold' }}>+</button>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {(clubs || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '25px', border: c.status === 'blocked' ? '1px solid #f44' : '1px solid #222' }}>
                                    <div style={{ flex: 1 }}>
                                        <b>{c.name}</b>
                                        <div style={{ fontSize: '9px', opacity: 0.3 }}>ID: {c.id}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button onClick={() => {
                                            const newS = c.status === 'active' ? 'blocked' : 'active';
                                            callAPI(`/api/admin/clubs/${c.id}`, { method: 'PUT', body: JSON.stringify({ status: newS }) }).then(() => callAPI('/api/admin/clubs').then(setClubs));
                                        }} style={{ background: 'none', border: 'none', fontSize: '18px' }}>{c.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => { setEditingClub(c); setClubForm({ name: c.name, address: c.address || '', level: c.level || 'standard', lat: c.lat || 41.2995, lng: c.lng || 69.2401 }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none' }}>✎</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ width: '100%', padding: '18px', background: '#39ff1411', border: '1px solid #39ff1433', borderRadius: '20px', color: '#39ff14', fontWeight: 'bold', marginBottom: '15px' }}>+ MENEJER QO'SHISH</button>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {(managers || []).map(m => (
                                <div key={m.id} style={{ background: '#111', padding: '25px', borderRadius: '35px', border: m.status === 'blocked' ? '1px solid #f445' : '1px solid #222' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <b style={{ fontSize: '18px', opacity: m.status === 'blocked' ? 0.4 : 1 }}>{m.username}</b>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <button onClick={() => toggleManagerStatus(m)} style={{ background: 'none', border: 'none', fontSize: '20px' }}>{m.status === 'active' ? '🛡️' : '🔓'}</button>
                                            <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '18px' }}>✎</button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px' }}>
                                        <span style={{ fontSize: '10px', background: '#fff1', padding: '6px 12px', borderRadius: '10px', color: '#39ff14' }}>🔑 {m.rawPassword || '---'}</span>
                                    </div>
                                    <div style={{ fontSize: '9px', opacity: 0.3, marginTop: '8px' }}>{String(m.clubName || '').toUpperCase()}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            {isClubFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '400px', background: '#111', borderRadius: '30px', padding: '30px', border: '1px solid #333' }}>
                        <h3 textAlign="center">KLUB</h3>
                        <div style={{ height: '220px', borderRadius: '20px', overflow: 'hidden', margin: '15px 0' }}>
                            <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                <LocationPicker onSelect={pos => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                            </MapContainer>
                        </div>
                        <input placeholder="Nomi..." value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <button onClick={handleSaveClub} style={{ width: '100%', padding: '18px', background: '#39ff14', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>OK</button>
                        <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#f44' }}>BEKOR QILISH</button>
                    </div>
                </div>
            )}

            {isManagerFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '350px', background: '#111', borderRadius: '30px', padding: '30px', border: '1px solid #333' }}>
                        <h3 textAlign="center">MENEJER</h3>
                        <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <input placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                        <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: '#fff', marginBottom: '15px' }}>
                            <option value="">Klub...</option>
                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={handleSaveManager} style={{ width: '100%', padding: '18px', background: '#39ff14', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>OK</button>
                        <button onClick={() => setIsManagerFormOpen(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#f44' }}>BEKOR QILISH</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
