import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

// 🗺️ LAZY LOAD MAP (Optimization!)
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const LocationPickerWrap = lazy(() => import('react-leaflet').then(mod => {
    const { useMapEvents } = mod;
    const LocationPicker = ({ onSelect }) => {
        useMapEvents({ click(e) { onSelect(e.latlng); } });
        return null;
    };
    return { default: LocationPicker };
}));

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const translations = {
    uz: {
        revenueDay: 'BUGUNGI DAROMAD', activeUsers: 'AKTIV O\'YINChILAR',
        totalClubs: 'UMUMIY KLUBLAR', managers: 'MENEJERLAR',
        load: 'YUKLAMA', search: 'Qidiruv...', new: '+ KLUB',
        save: 'SAQLASh ✨', cancel: 'BEKOR QILISh', assign: 'TAYINLASh',
        history: 'KLUBLAR TARIXI (REG) 🏛️'
    },
    ru: {
        revenueDay: 'ДОХОД СЕГОДНЯ', activeUsers: 'АКТИВНЫЕ ИГРОКИ',
        totalClubs: 'ВСЕГО КЛУБОВ', managers: 'МЕНЕДЖЕРОВ',
        load: 'ЗАГРУЗКА', search: 'Поиск...', new: '+ КЛУБ',
        save: 'СОХРАНИТЬ ✨', cancel: 'ОТМЕНА', assign: 'НАЗНАЧИТЬ',
        history: 'ИСТОРИЯ КЛУБОВ (РЕГ) 🏛️'
    }
};

const SuperAdminDashboard = ({ activeTab }) => {
    const [lang, setLang] = useState('uz');
    const t = translations[lang];

    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isClubFormOpen, setIsClubFormOpen] = useState(false);
    const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
    const [editingClub, setEditingClub] = useState(null);

    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', status: 'active', clubId: '' });

    useEffect(() => {
        fetchClubs(); fetchManagers(); fetchStats();
    }, []);

    const fetchClubs = async () => { try { const data = await callAPI('/api/admin/clubs'); setClubs(data || []); } catch (e) { } };
    const fetchManagers = async () => { try { const data = await callAPI('/api/admin/managers'); setManagers(data || []); } catch (e) { } };
    const fetchStats = async () => { try { const data = await callAPI('/api/admin/stats'); if (data) setStats(data); } catch (e) { } };

    return (
        <div style={{ padding: '15px', paddingBottom: '100px', minHeight: '100vh', background: '#000', color: '#fff', fontSmooth: 'antialiased' }}>

            {/* LANG (Minimalist) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px', marginBottom: '15px' }}>
                {['uz', 'ru'].map(l => (
                    <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? '#39ff14' : '#111', border: 'none', color: lang === l ? '#000' : '#fff', fontSize: '10px', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' }}>{l.toUpperCase()}</button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && stats && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>

                        <div style={{ background: '#111', border: '1px solid #333', padding: '30px', borderRadius: '35px', textAlign: 'center' }}>
                            <span style={{ fontSize: '9px', color: '#39ff14', letterSpacing: '3px' }}>{t.totalClubs}</span>
                            <h1 style={{ fontSize: '60px', margin: '10px 0', color: '#39ff14' }}>{stats.totalClubs}</h1>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                <span style={{ fontSize: '8px', opacity: 0.5 }}>{t.revenueDay}</span>
                                <h3 style={{ fontSize: '20px', margin: '5px 0' }}>{stats.todayRevenue.toLocaleString()}</h3>
                            </div>
                            <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                <span style={{ fontSize: '8px', opacity: 0.5 }}>{t.activeUsers}</span>
                                <h3 style={{ fontSize: '20px', margin: '5px 0' }}>{stats.activeUsers} 🟢</h3>
                            </div>
                        </div>

                        {/* HISTORY (Minimal List) */}
                        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '30px', border: '1px solid #333' }}>
                            <span style={{ fontSize: '9px', opacity: 0.5, display: 'block', marginBottom: '15px' }}>{t.history}</span>
                            {(stats.clubsHistory || []).map((c, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222', fontSize: '11px' }}>
                                    <span>{c.name}</span>
                                    <span style={{ opacity: 0.4 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '12px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', padding: '0 20px', borderRadius: '15px', fontWeight: 'bold' }}>{t.new}</button>
                        </div>
                        {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                            <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '25px', border: club.status === 'blocked' ? '1px solid #f44' : '1px solid #222' }}>
                                <div style={{ flex: 1 }}>{club.name}</div>
                                <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none' }}>✎</button>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '10px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: '#39ff1411', border: '1px solid #39ff1455', padding: '15px', borderRadius: '20px', color: '#39ff14' }}>+ {t.assign}</button>
                        {managers.map(m => (
                            <div key={m.id} style={{ background: '#111', padding: '20px', borderRadius: '30px', border: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{m.username}</b>
                                    <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none' }}>✎</button>
                                </div>
                                <div style={{ fontSize: '10px', color: '#39ff14', marginTop: '10px' }}>🔑 {m.rawPassword || '---'}</div>
                                <div style={{ fontSize: '8px', opacity: 0.3, marginTop: '5px' }}>{String(m.clubName || '').toUpperCase()}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SEPARATED LAG-FREE MODALS (Optimization: NO BLUR) */}
            <AnimatePresence>
                {isClubFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000e', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '450px', background: '#111', border: '1px solid #333', borderRadius: '35px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>{editingClub ? '✎' : '+'} KLUB</h3>
                            <Suspense fallback={<div style={{ height: '200px', background: '#222', borderRadius: '20px' }} />}>
                                <div style={{ height: '200px', borderRadius: '20px', overflow: 'hidden', marginBottom: '15px' }}>
                                    <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                        <LocationPickerWrap onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                    </MapContainer>
                                </div>
                            </Suspense>
                            <input placeholder="Nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                            <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} />
                            <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}>{t.save}</button>
                            <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isManagerFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#000e', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid #333', borderRadius: '35px', padding: '25px' }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>👤 MENEJER</h3>
                            <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                            <input type="text" placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }} />
                            <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '15px' }}>
                                <option value="">Klub...</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button onClick={handleSaveManager} style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}>OK</button>
                            <button onClick={() => setIsManagerFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
