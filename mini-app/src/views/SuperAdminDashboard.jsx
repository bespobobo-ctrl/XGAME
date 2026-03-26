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
        totalClubs: 'UMUMIY KLUBLAR', revenueDay: 'BUGUNGI DAROMAD', activePlayers: 'AKTIV O\'YINChILAR',
        peakHours: 'TIRBANLIK SOATLARI', recentAct: 'JONLI VOQEALAR 🕵️‍♂️', clubHistory: 'KLUBLAR TARIXI (REG) 🏛️',
        systemLoad: 'YUKLAMA', search: 'Qidiruv...', newClub: '+ KLUB', assign: 'TAYINLASh',
        save: 'SAQLASh ✨', cancel: 'BEKOR QILISh', login: 'Login', password: 'Parol', update: 'YANGILASH 🚀'
    },
    ru: {
        totalClubs: 'ВСЕГО КЛУБОВ', revenueDay: 'ДОХОД СЕГОДНЯ', activePlayers: 'АКТИВНЫЕ ИГРОКИ',
        peakHours: 'ЧАСЫ ПИК 📈', recentAct: 'ЖИВАЯ ЛЕНТА 🕵️‍♂️', clubHistory: 'ИСТОРИЯ КЛУБОВ (РЕГ) 🏛️',
        systemLoad: 'ЗАГРУЗКА', search: 'Поиск...', newClub: '+ КЛУБ', assign: 'НАЗНАЧИТЬ',
        save: 'СОХРАНИТЬ ✨', cancel: 'ОТМЕНА', login: 'Логин', password: 'Пароль', update: 'ОБНОВИТЬ 🚀'
    }
};

const SuperAdminDashboard = ({ activeTab }) => {
    const [lang, setLang] = useState('uz');
    const t = translations[lang];

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
        const loadInitial = async () => {
            try {
                const [c, m, s] = await Promise.all([
                    callAPI('/api/admin/clubs'),
                    callAPI('/api/admin/managers'),
                    callAPI('/api/admin/stats')
                ]);
                setClubs(c || []); setManagers(m || []); if (s) setStats(s);
            } catch (e) { }
        };
        loadInitial();
        const poller = setInterval(async () => {
            const s = await callAPI('/api/admin/stats'); if (s) setStats(s);
        }, 60000);
        return () => clearInterval(poller);
    }, []);

    const formatDate = (date, full = false) => {
        if (!date) return '---';
        const opt = full ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', opt);
    };

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

    return (
        <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '15px', fontSmooth: 'antialiased' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                {['uz', 'ru'].map(l => <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? '#39ff14' : '#111', color: lang === l ? '#000' : '#fff', border: 'none', padding: '6px 15px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{l.toUpperCase()}</button>)}
            </div>

            <AnimatePresence mode="wait">
                {/* 📊 DASHBOARD: COMBINED & RESTORED */}
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        {stats ? (
                            <>
                                {/* BIG COUNTER */}
                                <div style={{ background: 'linear-gradient(rgba(57, 255, 20, 0.08), transparent)', border: '1px solid #333', padding: '40px 30px', borderRadius: '45px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>{t.totalClubs}</span>
                                    <h1 style={{ fontSize: '80px', margin: '5px 0', fontWeight: '950', textShadow: '0 0 30px #39ff1444' }}>{stats.totalClubs}</h1>
                                </div>

                                {/* REVENUE & ACTIVE */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                                        <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>{t.revenueDay}</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0', color: '#39ff14' }}>{(stats.todayRevenue || 0).toLocaleString()} 📈</h3>
                                    </div>
                                    <div style={{ background: '#111', padding: '25px', borderRadius: '30px', border: '1px solid #222' }}>
                                        <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>{t.activePlayers}</p>
                                        <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{stats.activeUsers || 0} 🟢</h3>
                                    </div>
                                </div>

                                {/* CHART MINI */}
                                <div style={{ background: '#0a0a0a', padding: '25px', borderRadius: '40px', border: '1px solid #222' }}>
                                    <span style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '15px' }}>{t.peakHours}</span>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '8px', padding: '0 10px' }}>
                                        {(stats.peakHours || []).map((h, i) => (
                                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} style={{ flex: 1, background: 'linear-gradient(#39ff14, #00ddeb)', borderRadius: '4px' }} />
                                        ))}
                                    </div>
                                </div>

                                {/* ACTIVITY FEED */}
                                <div style={{ background: '#0a0a0a', padding: '25px', borderRadius: '40px', border: '1px dashed #333', maxHeight: '200px', overflowY: 'auto' }}>
                                    <h4 style={{ fontSize: '10px', opacity: 0.4, marginBottom: '15px' }}>{t.recentAct}</h4>
                                    {(stats.recentActivity || []).map((act, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingBottom: '10px', borderBottom: '1px solid #111', marginBottom: '10px' }}>
                                            <span>👤 {act.user}</span>
                                            <span style={{ color: '#00ddeb' }}>{act.action}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* REGISTRATION HISTORY */}
                                <div style={{ background: '#111', padding: '30px', borderRadius: '40px', border: '1px solid #333' }}>
                                    <h4 style={{ fontSize: '10px', opacity: 0.4, marginBottom: '20px' }}>{t.clubHistory}</h4>
                                    {(stats.clubsHistory || []).map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', padding: '12px 0', fontSize: '12px' }}>
                                            <b style={{ color: '#39ff14' }}>{c.name}</b>
                                            <span style={{ opacity: 0.3 }}>{formatDate(c.createdAt, true)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '100px', textAlign: 'center' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '60px' }}>🛰️</motion.div>
                                <p style={{ fontSize: '10px', opacity: 0.3, letterSpacing: '4px', marginTop: '20px' }}>INITIALIZING NEXUS...</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 🏛️ CLUBS */}
                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '15px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold' }}>{t.newClub}</button>
                        </div>
                        {(clubs || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                            <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '35px', border: club.status === 'blocked' ? '2px solid #ff4444' : '1px solid #222' }}>
                                <div style={{ flex: 1 }}>
                                    <b style={{ opacity: club.status === 'blocked' ? 0.3 : 1 }}>{club.name}</b>
                                    <div style={{ fontSize: '8px', opacity: 0.3 }}>{club.address}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button onClick={() => {
                                        const newS = club.status === 'active' ? 'blocked' : 'active';
                                        callAPI(`/api/admin/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ status: newS }) }).then(() => callAPI('/api/admin/clubs').then(setClubs));
                                    }} style={{ background: 'none', border: 'none', fontSize: '20px' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                    <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* 👤 MANAGERS */}
                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: '#39ff1411', border: '1px solid #39ff1444', padding: '18px', borderRadius: '25px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assign}</button>
                        {(managers || []).map(m => (
                            <div key={m.id} style={{ background: '#111', padding: '25px', borderRadius: '35px', border: m.status === 'blocked' ? '2px solid #ff4444' : '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <b style={{ fontSize: '18px', opacity: m.status === 'blocked' ? 0.4 : 1 }}>{m.username}</b>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <button onClick={() => {
                                            const newS = m.status === 'active' ? 'blocked' : 'active';
                                            callAPI(`/api/admin/managers/${m.id}`, { method: 'PUT', body: JSON.stringify({ status: newS }) }).then(() => callAPI('/api/admin/managers').then(setManagers));
                                        }} style={{ background: 'none', border: 'none', fontSize: '20px' }}>{m.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <span style={{ fontSize: '10px', background: '#fff1', padding: '6px 15px', borderRadius: '10px', color: '#39ff14', fontWeight: 'bold' }}>🔑 {m.rawPassword || '---'}</span>
                                </div>
                                <div style={{ fontSize: '9px', opacity: 0.3, marginTop: '10px', borderTop: '1px solid #fff1', paddingTop: '10px' }}>{String(m.clubName || '').toUpperCase()}</div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SEPARATED LAG-FREE MODALS */}
            {isClubFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '450px', background: '#111', border: '1px solid #333', borderRadius: '45px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '20px' }}>KLUB</h2>
                        <div style={{ height: '220px', borderRadius: '25px', overflow: 'hidden', marginBottom: '20px' }}>
                            <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                            </MapContainer>
                        </div>
                        <input placeholder="Klub nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                        <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '20px', boxSizing: 'border-box' }} />
                        <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold', color: '#000' }}>OK</button>
                        <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                    </div>
                </div>
            )}

            {isManagerFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid #333', borderRadius: '40px', padding: '30px' }}>
                        <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '25px' }}>{editingManager ? t.update : t.assign}</h2>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <input placeholder={t.login} value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff' }} />
                            <input placeholder={t.password} value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff' }} />
                            <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#000', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff' }}>
                                <option value="">Klub...</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button onClick={handleSaveManager} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold' }}>OK</button>
                            <button onClick={() => setIsManagerFormOpen(false)} style={{ color: '#ff4444', background: 'none', border: 'none', marginTop: '10px' }}>{t.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
