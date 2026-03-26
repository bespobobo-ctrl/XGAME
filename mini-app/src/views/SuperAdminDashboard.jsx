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
        stats: '📊 STATISTIKA',
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
        assignManager: 'MENEJER TAYINLASH',
        editManager: 'TAHRIRLASH ✎',
        login: 'Login',
        password: 'Parol (bo\'sh bo\'lsa o\'zgarmaydi)',
        assign: 'TAYINLASH 👤',
        update: 'YANGILASH 🚀',
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
        editManager: 'ИЗМЕНИТЬ МЕНЕДЖЕРА ✎',
        login: 'Логин',
        password: 'Пароль (пусто - без изменений)',
        assign: 'НАЗНАЧИТЬ 👤',
        update: 'ОБНОВИТЬ 🚀',
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

    // 🧬 SEPARATED MODAL STATES (Optimization!)
    const [isClubFormOpen, setIsClubFormOpen] = useState(false);
    const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);

    const [editingClub, setEditingClub] = useState(null);
    const [editingManager, setEditingManager] = useState(null);

    const [clubForm, setClubForm] = useState({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
    const [managerForm, setManagerForm] = useState({ username: '', password: '', clubId: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs(); fetchManagers();
    }, []);

    const fetchClubs = async () => {
        try { const data = await callAPI('/api/admin/clubs'); setClubs(data || []); } catch (e) { }
    };
    const fetchManagers = async () => {
        try { const data = await callAPI('/api/admin/managers'); setManagers(data || []); } catch (e) { }
    };

    const isOnline = (dateStr) => {
        if (!dateStr) return false;
        return (Date.now() - new Date(dateStr).getTime()) < 300000;
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
            if (result.success) {
                setIsClubFormOpen(false); setEditingClub(null); fetchClubs();
                setClubForm({ name: '', address: '', level: 'standard', lat: 41.2995, lng: 69.2401 });
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSaveManager = async () => {
        if (!managerForm.username || (!editingManager && !managerForm.password) || !managerForm.clubId) return alert('To\'ldiring!');
        setLoading(true);
        try {
            const url = editingManager ? `/api/admin/managers/${editingManager.id}` : '/api/admin/managers';
            const res = await callAPI(url, { method: editingManager ? 'PUT' : 'POST', body: JSON.stringify(managerForm) });
            if (res.success) {
                setIsManagerFormOpen(false); setEditingManager(null); fetchManagers();
                setManagerForm({ username: '', password: '', clubId: '' });
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const deleteManager = async (id) => {
        if (!window.confirm(t.delete)) return;
        try { await callAPI(`/api/admin/managers/${id}`, { method: 'DELETE' }); fetchManagers(); } catch (e) { console.error(e); }
    };

    return (
        <div className="admin-dashboard-view" style={{ padding: '15px', paddingBottom: '120px', minHeight: '100vh', background: '#000', color: '#fff' }}>

            {/* LANG TOGGLE */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => setLang('uz')} style={{ background: lang === 'uz' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'uz' ? '#000' : '#fff', fontSize: '9px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>UZ</button>
                <button onClick={() => setLang('ru')} style={{ background: lang === 'ru' ? '#39ff14' : 'none', border: '1px solid #39ff14', color: lang === 'ru' ? '#000' : '#fff', fontSize: '9px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>RU</button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ background: 'rgba(57, 255, 20, 0.08)', padding: '40px', borderRadius: '35px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#39ff14', letterSpacing: '4px' }}>{t.nodesOnline}</span>
                            <h1 style={{ fontSize: '80px', margin: '5px 0', fontWeight: '950' }}>{clubs.length}</h1>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'clubs' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input placeholder={t.searchNodes} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, background: '#111', border: '1px solid #fff2', borderRadius: '15px', padding: '12px', color: '#fff' }} />
                            <button onClick={() => setIsClubFormOpen(true)} style={{ background: '#39ff14', border: 'none', width: '55px', borderRadius: '15px', fontWeight: 'bold' }}>+</button>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {clubs.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(club => (
                                <div key={club.id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '25px', border: '1px solid #fff1' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{club.name}</h4>
                                        <span style={{ fontSize: '8px', opacity: 0.3 }}>{club.address}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button onClick={() => { setEditingClub(club); setClubForm({ name: club.name, address: club.address, level: club.level, lat: club.lat, lng: club.lng }); setIsClubFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '18px' }}>✎</button>
                                        <button onClick={() => callAPI(`/api/admin/clubs/${club.id}`, { method: 'DELETE' }).then(fetchClubs)} style={{ opacity: 0.2, background: 'none', border: 'none', fontSize: '16px' }}>🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'managers' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                        <button onClick={() => setIsManagerFormOpen(true)} style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid #39ff14', padding: '15px', borderRadius: '20px', color: '#39ff14', fontWeight: 'bold' }}>+ {t.assignManager}</button>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {managers.map(m => {
                                const online = isOnline(m.lastActive);
                                return (
                                    <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '30px', border: '1px solid #fff1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#39ff14' : '#555' }} />
                                                <h3 style={{ margin: 0, fontSize: '18px' }}>{m.username}</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <button onClick={() => { setEditingManager(m); setManagerForm({ username: m.username, password: '', clubId: m.ClubId }); setIsManagerFormOpen(true); }} style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: '18px' }}>✎</button>
                                                <button onClick={() => deleteManager(m.id)} style={{ opacity: 0.2, background: 'none', border: 'none' }}>🗑️</button>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '9px', background: '#39ff1411', color: '#39ff14', padding: '4px 10px', borderRadius: '6px' }}>{m.clubName}</span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', opacity: 0.5, fontSize: '10px' }}>
                                            <div>{t.lastActive}: <b>{formatDate(m.lastActive)}</b></div>
                                            <div>{t.givenDate}: <b>{formatDate(m.createdAt)}</b></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏆 MODAL: CLUB OPTIMIZED 🗺️ */}
            <AnimatePresence>
                {isClubFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <div style={{ width: '100%', maxWidth: '450px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '40px', padding: '30px', overflowY: 'auto', maxHeight: '90vh' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center' }}>{editingClub ? t.editClub : t.newClub}</h2>
                            <div style={{ height: '200px', borderRadius: '20px', overflow: 'hidden', marginBottom: '15px' }}>
                                <MapContainer center={[clubForm.lat, clubForm.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[clubForm.lat, clubForm.lng]} icon={greenIcon} />
                                    <LocationPicker onSelect={(pos) => setClubForm({ ...clubForm, lat: pos.lat, lng: pos.lng })} />
                                </MapContainer>
                            </div>
                            <input placeholder={t.clubName} value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '10px' }} />
                            <input placeholder={t.address} value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '15px' }} />
                            <button onClick={handleSaveClub} style={{ width: '100%', background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold' }}>{t.save}</button>
                            <button onClick={() => setIsClubFormOpen(false)} style={{ width: '100%', color: '#ff4444', background: 'none', border: 'none', marginTop: '10px' }}>{t.cancel}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 👤 MODAL: MANAGER (LIGHTWEIGHT - NO LAG) ⚡ */}
            <AnimatePresence>
                {isManagerFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        <div style={{ width: '100%', maxWidth: '400px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '35px', padding: '30px' }}>
                            <h2 style={{ color: '#39ff14', textAlign: 'center' }}>{editingManager ? t.editManager : t.assignManager}</h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <input placeholder={t.login} value={managerForm.username} onChange={e => setManagerForm({ ...managerForm, username: e.target.value })} style={{ background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <input type="text" placeholder={t.password} value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })} style={{ background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff' }} />
                                <select value={managerForm.clubId} onChange={e => setManagerForm({ ...managerForm, clubId: e.target.value })} style={{ background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '15px', color: '#fff' }}>
                                    <option value="">Klub...</option>
                                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <button onClick={handleSaveManager} style={{ background: '#39ff14', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px' }}>{editingManager ? t.update : t.assign}</button>
                                <button onClick={() => setIsManagerFormOpen(false)} style={{ color: '#ff4444', background: 'none', border: 'none', marginTop: '5px' }}>{t.cancel}</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SuperAdminDashboard;
