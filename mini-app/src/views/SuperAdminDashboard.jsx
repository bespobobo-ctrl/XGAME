import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_URL, { callAPI } from '../api';

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
        search: 'Qidiruv...', newClub: '+ KLUB', assign: 'TAYINLASh',
        save: 'SAQLASh ✨', cancel: 'BEKOR QILISh', login: 'Login', password: 'Parol',
        imgUpload: 'RASM YUKLASH 📸', name: 'Nomi', address: 'Manzili'
    },
    ru: {
        totalClubs: 'ВСЕГО КЛУБОВ', revenueDay: 'ДОХОД СЕГОДНЯ', activePlayers: 'АКТИВНЫЕ ИГРОКИ',
        peakHours: 'ЧАСЫ ПИК 📈', recentAct: 'ЖИВАЯ ЛЕНТА 🕵️‍♂️', clubHistory: 'ИСТОРИЯ КЛУБОВ (РЕГ) 🏛️',
        search: 'Поиск...', newClub: '+ КЛУБ', assign: 'НАЗНАЧИТЬ',
        save: 'СОХРАНИТЬ ✨', cancel: 'ОТМЕНА', login: 'Логин', password: 'Пароль',
        imgUpload: 'ЗАГРУЗИТЬ ФОТО 📸', name: 'Название', address: 'Адрес'
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
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [c, m, s] = await Promise.all([
                    callAPI('/api/admin/clubs'),
                    callAPI('/api/admin/managers'),
                    callAPI('/api/admin/stats')
                ]);
                setClubs(c || []); setManagers(m || []); if (s) setStats(s);
            } catch (e) { }
        };
        loadAll();
    }, []);

    const handleSaveClub = async () => {
        if (!clubForm.name || !clubForm.address) return alert('Klub nomi va manzili kerak!');

        const formData = new FormData();
        formData.append('name', clubForm.name);
        formData.append('address', clubForm.address);
        formData.append('level', clubForm.level);
        formData.append('lat', clubForm.lat);
        formData.append('lng', clubForm.lng);
        if (selectedImage) formData.append('image', selectedImage);

        const url = editingClub ? `/api/admin/clubs/${editingClub.id}` : '/api/admin/clubs';
        const method = editingClub ? 'PUT' : 'POST';

        try {
            const res = await fetch(`${API_URL}${url}`, {
                method,
                headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setIsClubFormOpen(false); setEditingClub(null); setSelectedImage(null);
                callAPI('/api/admin/clubs').then(setClubs);
            }
        } catch (e) { alert("Server error!"); }
    };

    const handleSaveManager = async () => {
        if (!managerForm.username || (!editingManager && !managerForm.password) || !managerForm.clubId) return alert('To\'ldiring');
        const res = await callAPI(editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers', {
            method: editingManager ? 'PUT' : 'POST', body: JSON.stringify(managerForm)
        });
        if (res.success) { setIsManagerFormOpen(false); setEditingManager(null); callAPI('/api/admin/managers').then(setManagers); }
    };

    const toggleBlockClub = async (id) => {
        const res = await callAPI(`/api/admin/clubs/${id}/block`, { method: 'PATCH' });
        if (res.success) callAPI('/api/admin/clubs').then(setClubs);
    };

    const deleteClub = async (id) => {
        if (!window.confirm('Klubni o\'chirmoqchimisiz?')) return;
        const res = await callAPI(`/api/admin/clubs/${id}`, { method: 'DELETE' });
        if (res.success) callAPI('/api/admin/clubs').then(setClubs);
    };

    const toggleBlockManager = async (id) => {
        const res = await callAPI(`/api/admin/managers/${id}/block`, { method: 'PATCH' });
        if (res.success) callAPI('/api/admin/managers').then(setManagers);
    };

    const deleteManager = async (id) => {
        if (!window.confirm('Menejerni o\'chirmoqchimisiz?')) return;
        const res = await callAPI(`/api/admin/managers/${id}`, { method: 'DELETE' });
        if (res.success) callAPI('/api/admin/managers').then(setManagers);
    };

    // API_URL is now imported from '../api'

    return (
        <div style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '15px' }}>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
                {['uz', 'ru'].map(l => <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? '#39ff14' : '#111', color: lang === l ? '#000' : '#fff', border: 'none', padding: '6px 15px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{l.toUpperCase()}</button>)}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && stats && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>

                        {/* 💎 PREMIUM STATS GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr', gap: '15px' }}>
                            <div style={{ background: 'linear-gradient(135deg, rgba(57,255,20,0.1), transparent)', border: '1px solid #333', padding: '30px', borderRadius: '40px', position: 'relative', overflow: 'hidden' }}>
                                <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '3px' }}>{t.totalClubs}</span>
                                <h1 style={{ fontSize: '50px', margin: '5px 0', fontWeight: '950' }}>{stats.totalClubs}</h1>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#39ff14', borderRadius: '50%', boxShadow: '0 0 15px #39ff14' }} />
                                <div style={{ fontSize: '10px', color: '#666' }}>ONLINE NODE SYSTEM 🟢</div>
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                    <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>ACTIVE SESSIONS 🕵️‍♂️</p>
                                    <h3 style={{ fontSize: '24px', margin: '5px 0', color: '#39ff14' }}>{stats.activeSessions || 0}</h3>
                                </div>
                                <div style={{ background: '#111', padding: '20px', borderRadius: '25px', border: '1px solid #222' }}>
                                    <p style={{ opacity: 0.4, fontSize: '9px', margin: 0 }}>{t.revenueDay}</p>
                                    <h3 style={{ fontSize: '24px', margin: '5px 0' }}>{(stats.todayRevenue || 0).toLocaleString()} <span style={{ fontSize: '10px', opacity: 0.5 }}>UZS</span></h3>
                                </div>
                            </div>
                        </div>

                        {/* 🚀 BROADCAST PANEL (New Component) */}
                        <div style={{ background: '#111', border: '1px solid #39ff1433', borderRadius: '40px', padding: '25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#39ff14', borderRadius: '50%' }} />
                                <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>BROADCASTER 🔉</span>
                            </div>
                            <textarea
                                id="broadcastInput"
                                placeholder="Barcha guruh adminlariga xabar yuborish... ✍️"
                                style={{ width: '100%', background: '#000', border: '1px solid #222', borderRadius: '20px', padding: '20px', color: '#fff', fontSize: '14px', minHeight: '100px', resize: 'none', boxSizing: 'border-box' }}
                            />
                            <button
                                onClick={async () => {
                                    const msg = document.getElementById('broadcastInput').value;
                                    if (!msg) return alert('Xabar yozing!');
                                    const res = await callAPI('/api/admin/broadcast', { method: 'POST', body: JSON.stringify({ message: msg }) });
                                    if (res.success) {
                                        alert('Xabar yuborildi! ✅');
                                        document.getElementById('broadcastInput').value = '';
                                    }
                                }}
                                style={{ width: '100%', marginTop: '15px', background: '#39ff14', color: '#000', border: 'none', padding: '15px', borderRadius: '18px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' }}
                            >
                                HAMMAGA TARQATISH 🔥
                            </button>
                        </div>

                        {/* 🏛️ SYSTEM LIVE LOGS */}
                        <div style={{ background: '#0a0a0a', padding: '25px', borderRadius: '40px', border: '1px solid #111' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '12px', opacity: 0.4 }}>TIZIM FAOLLIYATI (LIVE) ⚡</h4>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {(stats.clubsHistory || []).map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#111', borderRadius: '20px', borderLeft: `3px solid ${h.status === 'active' ? '#39ff14' : '#ff4444'}` }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{h.name}</div>
                                            <div style={{ fontSize: '8px', opacity: 0.3 }}>Klub muvaffaqiyatli qo'shildi</div>
                                        </div>
                                        <div style={{ fontSize: '9px', opacity: 0.5 }}>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 🛠️ SERVER HEALTH STATUS */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                            <div style={{ fontSize: '9px' }}>SYSTEM: <span style={{ color: '#39ff14' }}>{stats.systemHealth}</span></div>
                            <div style={{ fontSize: '9px' }}>LOAD: <span style={{ color: '#39ff14' }}>{stats.serverLoad}</span></div>
                            <div style={{ fontSize: '9px' }}>DB: <span style={{ color: '#39ff14' }}>CONNECTED 🟢</span></div>
                        </div>

                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '15px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold' }}>{t.newClub}</button>
                        </div>
                        {/* CLUBS LIST WITH AVATARS! */}
                        {(clubs || []).filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                            <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '35px', border: club.status === 'blocked' ? '2px solid #ff4444' : '1px solid #222' }}>
                                <img src={club.image ? `${API_URL}${club.image}` : `${API_URL}/uploads/default_club.png`} style={{ width: '55px', height: '55px', borderRadius: '20px', objectFit: 'cover', marginRight: '15px', border: '2px solid #39ff1433' }} />
                                <div style={{ flex: 1 }}>
                                    <b style={{ opacity: club.status === 'blocked' ? 0.3 : 1 }}>{club.name}</b>
                                    <div style={{ fontSize: '8px', opacity: 0.3 }}>{club.address}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#aaa', background: 'none', border: 'none', fontSize: '18px' }}>✎</button>
                                    <button onClick={() => toggleBlockClub(club.id)} style={{ color: club.status === 'blocked' ? '#ff4444' : '#39ff14', background: 'none', border: 'none', fontSize: '18px' }}>{club.status === 'blocked' ? '🔓' : '🔒'}</button>
                                    <button onClick={() => deleteClub(club.id)} style={{ color: '#ff4444', background: 'none', border: 'none', fontSize: '18px' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: '#39ff1411', border: '1px solid #39ff1444', padding: '18px', borderRadius: '25px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assign}</button>
                        {(managers || []).map(m => (
                            <div key={m.id} style={{ background: '#111', padding: '25px', borderRadius: '35px', border: m.status === 'blocked' ? '2px solid #ff4444' : '1px solid #222' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <b style={{ fontSize: '18px', opacity: m.status === 'blocked' ? 0.3 : 1 }}>{m.username}</b>
                                        <div style={{ fontSize: '10px', color: '#39ff14', marginTop: '4px' }}>🏛️ {m.clubName}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', status: m.status, clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#aaa', background: 'none', border: 'none', fontSize: '18px' }}>✎</button>
                                        <button onClick={() => toggleBlockManager(m.id)} style={{ color: m.status === 'blocked' ? '#ff4444' : '#39ff14', background: 'none', border: 'none', fontSize: '18px' }}>{m.status === 'blocked' ? '🔓' : '🔒'}</button>
                                        <button onClick={() => deleteManager(m.id)} style={{ color: '#ff4444', background: 'none', border: 'none', fontSize: '18px' }}>🗑️</button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '10px', background: '#fff1', padding: '8px 15px', borderRadius: '12px', color: '#39ff14', fontWeight: 'bold' }}>🔑 {m.rawPassword || '---'}</span>
                                    <span style={{ fontSize: '8px', color: m.status === 'blocked' ? '#ff4444' : '#39ff14', textTransform: 'uppercase', letterSpacing: '1px' }}>● {m.status}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL: CLUB WITH IMAGE UPLOADER */}
            {isClubFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '450px', background: '#111', border: '1px solid #333', borderRadius: '45px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '20px' }}>KLUB</h2>

                        {/* IMAGE SELECTOR 📸 */}
                        <div onClick={() => fileInputRef.current.click()} style={{ width: '100%', height: '120px', background: '#000', borderRadius: '25px', border: '2px dashed #39ff1444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden', cursor: 'pointer' }}>
                            {selectedImage ? (
                                <img src={URL.createObjectURL(selectedImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : <span>{t.imgUpload}</span>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={(e) => setSelectedImage(e.target.files[0])} style={{ display: 'none' }} accept="image/*" />

                        <div style={{ height: '180px', borderRadius: '25px', overflow: 'hidden', marginBottom: '20px' }}>
                            <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                            </MapContainer>
                        </div>
                        <input placeholder={t.name} value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                        <input placeholder={t.address} value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '20px', boxSizing: 'border-box' }} />
                        <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '20px', borderRadius: '15px', fontWeight: 'bold', color: '#000' }}>OK</button>
                        <button onClick={() => { setIsClubFormOpen(false); setEditingClub(null); setSelectedImage(null); }} style={{ width: '100%', background: 'none', border: 'none', color: '#ff4444', marginTop: '10px' }}>{t.cancel}</button>
                    </div>
                </div>
            )}

            {/* MANAGER MODAL */}
            {isManagerFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.98)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '400px', background: '#111', border: '1px solid #333', borderRadius: '40px', padding: '30px' }}>
                        <h2 style={{ color: '#39ff14', textAlign: 'center', marginBottom: '25px' }}>MENEJER</h2>
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
