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

const translations = {
    uz: {
        statsTile: '📊 KOMANDA MARKAZI',
        revenueDay: 'BUGUNGI DAROMAD',
        activeUsers: 'AKTIV O\'YINChILAR',
        peakHours: 'TIRBANLIK SOATLARI',
        recentAct: 'JONLI VOQEALAR 🕵️‍♂️',
        systemLoad: 'TIZIM YUKLAMASI',
        searchNodes: 'Qidiruv...',
        newClub: 'YANGI KLUB 🏛️',
        editClub: 'TAHRIRLASH ✎',
        save: 'SAQLASh ✨',
        cancel: 'BEKOR QILISh',
        assign: 'TAYINLASH 👤',
        online: 'ONLAYN',
        offline: 'OFLAYN'
    },
    ru: {
        statsTile: '📊 КОМАНДНЫЙ ЦЕНТР',
        revenueDay: 'ДОХОД СЕГОДНЯ',
        activeUsers: 'АКТИВНЫЕ ИГРОКИ',
        peakHours: 'ЧАСЫ ПИК 📈',
        recentAct: 'ЖИВАЯ ЛЕНТА 🕵️‍♂️',
        systemLoad: 'ЗАГРУЗКА',
        searchNodes: 'Поиск...',
        newClub: 'НОВЫЙ КЛУБ 🏛️',
        editClub: 'ИЗМЕНИТЬ ✎',
        save: 'СОХРАНИТЬ ✨',
        cancel: 'ОТМЕНА',
        assign: 'НАЗНАЧИТЬ 👤',
        online: 'ОНЛАЙН',
        offline: 'ОФФЛАЙН'
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs(); fetchManagers(); fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchClubs = async () => { try { const data = await callAPI('/api/admin/clubs'); setClubs(data || []); } catch (e) { } };
    const fetchManagers = async () => { try { const data = await callAPI('/api/admin/managers'); setManagers(data || []); } catch (e) { } };
    const fetchStats = async () => {
        try {
            const data = await callAPI('/api/admin/stats');
            if (data) setStats(data);
        } catch (e) { console.log("Stats fetch error", e); }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        return new Date(dateStr).toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const handleSaveClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', clubForm.name); formData.append('address', clubForm.address);
            formData.append('level', clubForm.level); formData.append('lat', clubForm.lat); formData.append('lng', clubForm.lng);
            if (selectedImage) formData.append('image', selectedImage);
            const res = await fetch(editingClub ? `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs/${editingClub.id}` : `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`, {
                method: editingClub ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` }, body: formData
            });
            if ((await res.json()).success) { setIsClubFormOpen(false); setEditingClub(null); fetchClubs(); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSaveManager = async () => {
        if (!managerForm.username || (!editingManager && !managerForm.password) || !managerForm.clubId) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const res = await callAPI(editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers', { method: editingManager ? 'PUT' : 'POST', body: JSON.stringify(managerForm) });
            if (res.success) { setIsManagerFormOpen(false); setEditingManager(null); fetchManagers(); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => setLang('uz')} style={{ background: lang === 'uz' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'uz' ? '#000' : '#fff', fontSize: '10px', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' }}>UZ</button>
                <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'ru' ? '#000' : '#fff', fontSize: '10px', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' }}>RU</button>
            </div>

            <AnimatePresence mode="wait">
                {/* 📊 DASHBOARD: COMMAND CENTER V5 (SAFETY WRAPPED) */}
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        {stats ? (
                            <>
                                {/* 💰 REVENUE */}
                                <div style={{ background: 'radial-gradient(circle at top, rgba(57, 255, 20, 0.1), transparent)', border: '1px solid #39ff1444', padding: '40px', borderRadius: '45px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '5px', opacity: 0.6 }}>{t.revenueDay}</span>
                                    <motion.h1 animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: '60px', margin: '15px 0', textShadow: '0 0 30px #39ff1455', fontWeight: '950' }}>
                                        {(stats.todayRevenue || 0).toLocaleString()} <span style={{ fontSize: '24px', opacity: 0.4 }}>UZS</span>
                                    </motion.h1>
                                    <div style={{ fontSize: '10px', color: '#39ff14', background: 'rgba(57, 255, 20, 0.1)', padding: '5px 15px', borderRadius: '20px', display: 'inline-block' }}>+12.4% 📈</div>
                                </div>

                                {/* 📉 CHART */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '40px', border: '1px solid #fff1' }}>
                                    <span style={{ fontSize: '10px', opacity: 0.5, display: 'block', marginBottom: '15px' }}>{t.peakHours}</span>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '8px', padding: '0 10px' }}>
                                        {(stats.peakHours || []).map((h, i) => (
                                            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} style={{ flex: 1, background: 'linear-gradient(to top, #39ff14, #00ddeb)', borderRadius: '4px', opacity: 0.8 }} />
                                        ))}
                                    </div>
                                </div>

                                {/* 🚁 GRID */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '35px', border: '1px solid #fff1' }}>
                                        <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>{t.activeUsers}</p>
                                        <h2 style={{ fontSize: '32px', margin: '5px 0' }}>{stats.activeUsers || 0} 🟢</h2>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '35px', border: '1px solid #fff1' }}>
                                        <p style={{ fontSize: '9px', opacity: 0.4, margin: 0 }}>{t.systemLoad}</p>
                                        <h2 style={{ fontSize: '32px', margin: '5px 0' }}>{stats.load || 42}% ⚙️</h2>
                                    </div>
                                </div>

                                {/* 🕵️‍♂️ FEED */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '35px', border: '1px dashed #fff2', maxHeight: '180px', overflowY: 'auto' }}>
                                    <h3 style={{ fontSize: '10px', opacity: 0.4, marginBottom: '15px' }}>{t.recentAct}</h3>
                                    {(stats.recentActivity || []).map((act, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid #fff1', paddingBottom: '8px', marginBottom: '8px' }}>
                                            <span>👤 {act.user}</span>
                                            <span style={{ color: '#00ddeb' }}>{act.action}</span>
                                            <span style={{ opacity: 0.3 }}>{formatDate(act.time)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* ⚡ LOADING PLACEHOLDER (NO BLACK SCREEN) */
                            <div style={{ padding: '80px', textAlign: 'center' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '50px' }}>🛰️</motion.div>
                                <p style={{ fontSize: '12px', opacity: 0.4, marginTop: '20px', letterSpacing: '4px' }}>CONNECTING TO NEXUS...</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 🏛️ CLUBS */}
                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.searchNodes} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #fff2', borderRadius: '15px', padding: '12px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '55px', borderRadius: '15px', fontWeight: 'bold' }}>+</button>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {(clubs || []).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '30px', border: club.status === 'blocked' ? '1px solid #ff4444' : '1px solid #fff1' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, opacity: club.status === 'blocked' ? 0.3 : 1 }}>{club.name}</h4>
                                        <span style={{ fontSize: '8px', opacity: 0.3 }}>{club.address}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button onClick={() => {
                                            const newS = club.status === 'active' ? 'blocked' : 'active';
                                            callAPI(`/api/admin/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ status: newS }) }).then(fetchClubs);
                                        }} style={{ background: 'none', border: 'none', fontSize: '20px' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 👤 MANAGERS */}
                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', padding: '15px', borderRadius: '25px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assign}</button>
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {(managers || []).map(m => (
                                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '35px', border: m.status === 'blocked' ? '1px solid #ff444455' : '1px solid #fff1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '20px' }}>{m.username}</h3>
                                        <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '20px' }}>✎</button>
                                    </div>
                                    <span style={{ fontSize: '9px', background: '#fff1', color: '#39ff14', padding: '4px 12px', borderRadius: '8px' }}>🔑 {m.rawPassword || '---'}</span>
                                    <p style={{ fontSize: '9px', opacity: 0.4, marginTop: '8px' }}>{m.clubName || '---'}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SEPARATED MODALS */}
            <AnimatePresence>
                {isClubFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '450px', background: '#050505', border: '1px solid #39ff1444', borderRadius: '45px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '25px' }}>{editingClub ? t.editClub : t.newClub}</h2>
                            <div style={{ height: '220px', borderRadius: '25px', overflow: 'hidden', marginBottom: '20px' }}>
                                <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                    <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                </MapContainer>
                            </div>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Nomi" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #fff2', padding: '18px', borderRadius: '20px', color: '#fff', boxSizing: 'border-box' }} />
                                <input placeholder="Manzil" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #fff2', padding: '18px', borderRadius: '20px', color: '#fff', boxSizing: 'border-box' }} />
                                <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '22px', borderRadius: '20px', fontWeight: 'bold' }}>{t.save}</button>
                                <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isManagerFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <div style={{ width: '100%', maxWidth: '400px', background: '#050505', border: '1px solid #39ff1444', borderRadius: '40px', padding: '30px' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '25px' }}>{t.assign}</h2>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input placeholder="Login" value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '18px', borderRadius: '20px', color: '#fff' }} />
                                <input type="text" placeholder="Parol" value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '18px', borderRadius: '20px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '18px', borderRadius: '20px', color: '#fff' }}>
                                    <option value="">Klub...</option>
                                    {(clubs || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={handleSaveManager} style={{ background: '#39ff14', color: '#000', border: 'none', padding: '22px', borderRadius: '20px', fontWeight: 'bold' }}>OK</button>
                                <button onClick={() => setIsManagerFormOpen(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
