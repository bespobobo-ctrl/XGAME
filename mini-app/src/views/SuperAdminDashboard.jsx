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
        stats: '📊 STATSTIKA',
        clubs: '🏛️ KLUBLAR',
        managers: '👤 MENEJERLAR',
        nodesOnline: 'TARMOQDAGI TIZIMLAR',
        activeClubs: 'FAOL KLUBAR',
        managersCount: 'MENEJERLAR SONI',
        systemLoad: 'TIZIM YUKLAMASI',
        globalMsg: 'GLOBAL XABAR YUBORISh',
        searchNodes: 'Qidiruv...',
        newClub: 'YANGI KLUB 🏛️',
        editClub: 'TAHRIRLASH ✎',
        clubName: 'Klub nomi',
        address: 'Manzil',
        level: 'Daraja',
        save: 'SAQLASh ✨',
        cancel: 'BEKOR QILISh',
        assignManager: 'YANGI MENEJER TAYINLASH',
        login: 'Login',
        password: 'Parol',
        assign: 'TAYINLASH 👤',
        delete: 'O\'chirilsinmi?',
        logout: '🚪 Chiqish',
        lastActive: 'Oxirgi faollik',
        givenDate: 'Berilgan sana',
        online: 'ONLAYN',
        offline: 'OFLAYN'
    },
    ru: {
        stats: '📊 СТАТИСТИКА',
        clubs: '🏛️ КЛУБЫ',
        managers: '👤 МЕНЕДЖЕРЫ',
        nodesOnline: 'СИСТЕМ В СЕТИ',
        activeClubs: 'АКТИВНЫЕ КЛУБЫ',
        managersCount: 'МЕНЕДЖЕРОВ',
        systemLoad: 'ЗАГРУЗКА',
        globalMsg: 'ОТПРАВИТЬ СООБЩЕНИЕ',
        searchNodes: 'Поиск...',
        newClub: 'НОВЫЙ КЛУБ 🏛️',
        editClub: 'ИЗМЕНИТЬ ✎',
        clubName: 'Название',
        address: 'Адрес',
        level: 'Уровень',
        save: 'СОХРАНИТЬ ✨',
        cancel: 'ОТМЕНА',
        assignManager: 'НАЗНАЧИТЬ МЕНЕДЖЕРА',
        login: 'Логин',
        password: 'Пароль',
        assign: 'НАЗНАЧИТЬ 👤',
        delete: 'Удалить?',
        logout: '🚪 Выход',
        lastActive: 'Последняя активность',
        givenDate: 'Дата выдачи',
        online: 'ОНЛАЙН',
        offline: 'ОФФЛАЙН'
    }
};

const SuperAdminDashboard = ({ activeTab }) => {
    const [lang, setLang] = useState('uz');
    const t = translations[lang];

    const [clubs, setClubs] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
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

    const isOnline = (dateStr) => {
        if (!dateStr) return false;
        const last = new Date(dateStr).getTime();
        const now = Date.now();
        return (now - last) < 300000; // 5 daqiqa ichida faollik bolsa Onlayn
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        return new Date(dateStr).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
            const url = editingClub ? `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs/${editingClub.id}` : `https://synthesis-legends-lamb-davidson.trycloudflare.com/api/admin/clubs`;
            const res = await fetch(url, { method: editingClub ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('x-token')}` }, body: formData });
            const result = await res.json();
            if (result.success) { closeModal(); fetchClubs(); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const toggleStatus = async (club) => {
        const newStatus = club.status === 'active' ? 'blocked' : 'active';
        try { await callAPI(`/api/admin/clubs/${club.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) }); fetchClubs(); } catch (e) { console.error(e); }
    };

    const deleteClub = async (id) => {
        if (!window.confirm(t.delete)) return;
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
            if (res.success) { fetchManagers(); setManagerForm({ username: '', password: '', clubId: '' }); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff' }}>

            {/* LANG TOGGLE */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => setLang('uz')} style={{ background: lang === 'uz' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'uz' ? '#000' : '#fff', fontSize: '9px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>UZ</button>
                <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'ru' ? '#000' : '#fff', fontSize: '9px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>RU</button>
            </div>

            <AnimatePresence mode="wait">
                {/* 📉 STATS */}
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: 'linear-gradient(rgba(57, 255, 20, 0.08), transparent)', border: '1px solid #39ff1433', padding: '40px 30px', borderRadius: '35px', textAlign: 'center', position: 'relative' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>{t.nodesOnline}</span>
                            <motion.h1 animate={{ textShadow: ['0 0 10px #39ff1455', '0 0 25px #39ff1455', '0 0 10px #39ff1455'] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: '80px', margin: '5px 0', fontWeight: '950' }}>{clubs.length}</motion.h1>
                            <p style={{ opacity: 0.4, fontSize: '12px' }}>{t.activeClubs}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', border: '1px solid #fff1' }}>
                                <span style={{ opacity: 0.4, fontSize: '8px' }}>{t.managersCount}</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>{managers.length}</h2>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '25px', border: '1px solid #fff1' }}>
                                <span style={{ opacity: 0.4, fontSize: '8px' }}>{t.systemLoad}</span>
                                <h2 style={{ fontSize: '28px', margin: '5px 0', color: '#00ddeb' }}>42% ✨</h2>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '25px', border: '1px dashed #fff2' }}>
                            <h3 style={{ fontSize: '10px', opacity: 0.4, margin: '0 0 10px 0' }}>{t.globalMsg}</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input placeholder="Type announcement..." style={{ background: '#000', border: '1px solid #fff2', padding: '12px', borderRadius: '12px', flex: 1, color: '#fff', fontSize: '12px' }} />
                                <button style={{ background: '#39ff14', border: 'none', width: '45px', borderRadius: '12px' }}>📡</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 🏛️ CLUBS */}
                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.searchNodes} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid #fff2', borderRadius: '15px', padding: '12px', color: '#fff' }} />
                            <button onClick={() => setIsFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '50px', borderRadius: '15px', fontWeight: 'bold' }}>+</button>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '25px', border: club.status === 'blocked' ? '1px solid #ff444455' : '1px solid #fff1' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#39ff1411', marginRight: '15px', overflow: 'hidden' }}>
                                        {club.image && <img src={`https://synthesis-legends-lamb-davidson.trycloudflare.com${club.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: club.status === 'blocked' ? 0.3 : 1 }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, opacity: club.status === 'blocked' ? 0.4 : 1 }}>{club.name}</h4>
                                        <span style={{ fontSize: '8px', opacity: 0.3 }}>{club.address}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => toggleStatus(club)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px' }}>{club.status === 'active' ? '🛡️' : '🔓'}</button>
                                        <button onClick={() => openEditModal(club)} style={{ background: 'none', border: 'none', color: '#39ff14', fontSize: '18px' }}>✎</button>
                                        <button onClick={() => deleteClub(club.id)} style={{ background: 'none', border: 'none', opacity: 0.15 }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 🛡️ MANAGERS MONITORING (OPTIMIZED!) */}
                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '20px' }}>
                        <button onClick={() => setIsFormOpen(true)} style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', padding: '15px', borderRadius: '20px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assignManager}</button>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {managers.map(m => {
                                const online = isOnline(m.lastActive);
                                return (
                                    <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '30px', border: '1px solid #fff1', position: 'relative' }}>
                                        {/* ONLINE DOT */}
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 'bold', color: online ? '#39ff14' : '#ff4444' }}>{online ? t.online : t.offline}</span>
                                            <motion.div animate={online ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#39ff14' : '#ff4444', boxShadow: online ? '0 0 10px #39ff14' : 'none' }} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #111, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff1' }}>👤</div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '18px' }}>{m.username}</h3>
                                                <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(57, 255, 20, 0.1)', color: '#39ff14', fontWeight: 'bold' }}>{m.clubName.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', borderTop: '1px solid #fff1', paddingTop: '10px' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '8px', opacity: 0.4 }}>{t.lastActive}</p>
                                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>{formatDate(m.lastActive)}</p>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '8px', opacity: 0.4 }}>{t.givenDate}</p>
                                                <p style={{ margin: 0, fontSize: '10px' }}>{formatDate(m.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🗺️ MODAL: SAVE/EDIT CLUB OR ASSIGN MANAGER */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: '450px', maxHeight: '95vh', overflowY: 'auto', background: '#0a0a0a', border: '1px solid #39ff1444', borderRadius: '40px', padding: '30px' }}>
                            {activeTab === 'clubs' ? (
                                <>
                                    <h2 style={{ margin: '0 0 20px', textAlign: 'center', color: '#39ff14' }}>{editingClub ? t.editClub : t.newClub}</h2>
                                    <div style={{ height: '220px', borderRadius: '25px', overflow: 'hidden', border: '1px solid #fff2', marginBottom: '20px' }}>
                                        <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                            <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                        </MapContainer>
                                    </div>
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        <input placeholder={t.clubName} value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                        <input placeholder={t.address} value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                        <select value={clubForm.level} onChange={e => setClubForm({ ...clubForm, level: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium 💎</option>
                                            <option value="platinum">Platinum 👑</option>
                                        </select>
                                        <input type="file" hidden id="imageInput" onChange={e => setSelectedImage(e.target.files[0])} />
                                        <label htmlFor="imageInput" style={{ cursor: 'pointer', textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px dashed #fff3' }}>📷 {selectedImage ? selectedImage.name : 'Rasm Tanlash'}</label>
                                        <button onClick={handleSaveClub} disabled={loading} style={{ background: 'linear-gradient(90deg, #39ff14, #00ddeb)', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 'bold' }}>{t.save}</button>
                                        <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#ff4444' }}>{t.cancel}</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 style={{ margin: '0 0 20px', textAlign: 'center', color: '#39ff14' }}>{t.assignManager}</h2>
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        <input placeholder={t.login} value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                        <input type="password" placeholder={t.password} value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#111', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                        <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#000', border: '1px solid #fff2', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                            <option value="">Klubni tanlang...</option>
                                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <button onClick={handleAddManager} disabled={loading} style={{ background: '#39ff14', border: 'none', padding: '20px', borderRadius: '20px', fontWeight: 'bold', color: '#000' }}>{t.assign}</button>
                                        <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#ff4444' }}>{t.cancel}</button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
