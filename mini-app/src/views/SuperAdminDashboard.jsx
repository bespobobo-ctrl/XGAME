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
    const [editingManager, setEditingManager] = useState(null);

    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', status: 'active', clubId: '' });

    useEffect(() => {
        fetchClubs(); fetchManagers(); fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchClubs = async () => { try { const data = await callAPI('/api/admin/clubs'); setClubs(data || []); } catch (e) { } };
    const fetchManagers = async () => { try { const data = await callAPI('/api/admin/managers'); setManagers(data || []); } catch (e) { } };
    const fetchStats = async () => { try { const data = await callAPI('/api/admin/stats'); if (data) setStats(data); } catch (e) { } };

    return (
        <div style={{ padding: '15px', paddingBottom: '100px', minHeight: '100vh', background: '#000', color: '#fff' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => setLang('uz')} style={{ background: lang === 'uz' ? '#39ff14' : '#111', border: 'none', color: lang === 'uz' ? '#000' : '#fff', fontSize: '10px', padding: '5px 12px', borderRadius: '10px' }}>UZ</button>
                <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#39ff14' : '#111', border: 'none', color: lang === 'ru' ? '#000' : '#fff', fontSize: '10px', padding: '5px 12px', borderRadius: '10px' }}>RU</button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        {stats ? (
                            <>
                                <div style={{ background: '#111', border: '1px solid #333', padding: '40px 30px', borderRadius: '40px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>{t.totalClubs}</span>
                                    <h1 style={{ fontSize: '80px', margin: '10px 0', textShadow: '0 0 20px #39ff1444' }}>{stats.totalClubs}</h1>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                                        <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>{t.revenueDay}</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{(stats.todayRevenue || 0).toLocaleString()} 📈</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                                        <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>{t.activeUsers}</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{stats.activeUsers || 0} 🟢</h3>
                                    </div>
                                </div>
                                <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '40px', border: '1px dashed #333' }}>
                                    <span style={{ fontSize: '10px', opacity: 0.4, display: 'block', marginBottom: '15px' }}>{t.history}</span>
                                    {(stats.clubsHistory || []).map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222', fontSize: '12px' }}>
                                            <b style={{ color: '#39ff14' }}>{c.name}</b>
                                            <span style={{ opacity: 0.4 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '100px', textAlign: 'center' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '60px' }}>🛰️</motion.div>
                                <p style={{ fontSize: '10px', opacity: 0.3, letterSpacing: '4px', marginTop: '20px' }}>FETCHING NEXUS CORE...</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '15px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold' }}>{t.new}</button>
                        </div>
                        {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                            <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '30px', border: club.status === 'blocked' ? '1px solid #f44' : '1px solid #222' }}>
                                <div style={{ flex: 1 }}>{club.name}</div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: '#39ff1411', border: '1px solid #39ff1455', padding: '18px', borderRadius: '25px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assign}</button>
                        {managers.map(m => (
                            <div key={m.id} style={{ background: '#111', padding: '25px', borderRadius: '35px', border: '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b style={{ fontSize: '18px' }}>{m.username}</b>
                                    <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                </div>
                                <div style={{ fontSize: '11px', color: '#39ff14', marginTop: '12px', background: '#39ff1411', padding: '6px 12px', borderRadius: '10px', display: 'inline-block' }}>🔑 {m.rawPassword || '---'}</div>
                                <div style={{ fontSize: '9px', opacity: 0.3, marginTop: '8px' }}>{String(m.clubName || '').toUpperCase()}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS (STANDARD IMPORTS FOR STABILITY) */}
            <AnimatePresence>
                {isClubFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '450px', background: '#111', border: '1px solid #333', borderRadius: '40px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '20px' }}>KLUB</h2>
                            <div style={{ height: '200px', borderRadius: '25px', overflow: 'hidden', marginBottom: '20px' }}>
                                <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                    <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                </MapContainer>
                            </div>
                            <input placeholder="Nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                            <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }} />
                            <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold' }}>SAQLASH ✨</button>
                            <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>BEKOR QILISH</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isManagerFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid #333', borderRadius: '40px', padding: '30px' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '25px' }}>MENEJER</h2>
                            <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                            <input type="text" placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                            <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', marginBottom: '20px' }}>
                                <option value="">Klub...</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button onClick={handleSaveManager} style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold' }}>OK</button>
                            <button onClick={() => setIsManagerFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>BEKOR QILISH</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
