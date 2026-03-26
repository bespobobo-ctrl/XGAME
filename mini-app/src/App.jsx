import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import './index.css';

const translations = {
  uz: {
    welcome: 'XUSH KELIBSIZ',
    home: 'ASOSIY',
    map: 'XARITA',
    cs2: 'CS2',
    top: 'TOP',
    profile: 'PROFIL',
    activePcHeader: 'ARENA STATISTIKASI',
    activePcLabel: 'KOMPYUTERLAR AKTIV',
    yourSession: 'HOZIRGI SEANSINGIZ',
    pcStatus: 'HOLATI: FAQOL',
    stopSession: 'SEANSNI YAKUNLASH',
    newsHeader: 'YANGILIKLAR',
    bronHeader: 'BRON VA STATUSLAR',
    fillingBalance: 'BALANSNI TO\'LDIRISH',
    adminPanel: 'ADMIN PANEL',
    adminActive: 'BOSHQARUV REJIMI AKTIV',
    login: 'KIRISH',
    signup: 'RO\'YXATDAN O\'TISH',
    name: 'Ism',
    emailPhone: 'Email yoki Telefon',
    password: 'Parol',
    forgotPass: 'Parolni unutdingizmi?',
    orLoginWith: 'Yoki quyidagilar orqali kiring',
    haveAccount: 'AKKAUNTINGIZ BORMI?',
    noAccount: 'AKKAUNTINGIZ YO\'QMI?',
    skip: 'O\'TKAZISH',
    startPlay: 'O\'YINNI BOSHLASH',
    language: 'TILNI TANLASH'
  },
  ru: {
    welcome: 'ДОБРО ПОЖАЛОВАТЬ',
    home: 'ГЛАВНАЯ',
    map: 'КАРТА',
    cs2: 'CS2',
    top: 'ТОП',
    profile: 'ПРОФИЛЬ',
    activePcHeader: 'СТАТИСТИКА АРЕНЫ',
    activePcLabel: 'ПК АКТИВНО',
    yourSession: 'ВАША ТЕКУЩАЯ СЕССИЯ',
    pcStatus: 'СТАТУС: АКТИВЕН',
    stopSession: 'ЗАВЕРШИТЬ СЕССИЮ',
    newsHeader: 'НОВОСТИ',
    bronHeader: 'БРОНЬ И СТАТУСЫ',
    fillingBalance: 'ПОПОЛНИТЬ БАЛАНС',
    adminPanel: 'АДМИН ПАНЕЛЬ',
    adminActive: 'РЕЖИМ УПРАВЛЕНИЯ АКТИВЕН',
    login: 'ВХОД',
    signup: 'РЕГИСТРАЦИЯ',
    name: 'Имя',
    emailPhone: 'Email или Телефон',
    password: 'Пароль',
    forgotPass: 'Забыли пароль?',
    orLoginWith: 'Или войдите через',
    haveAccount: 'ЕСТЬ АККАУНТ?',
    noAccount: 'НЕТ АККАУНТА?',
    skip: 'ПРОПУСТИТЬ',
    startPlay: 'НАЧАТЬ ИГРУ',
    language: 'ВЫБОР ЯЗЫКА'
  }
};

const slides = [
  {
    title: 'X-GAME',
    desc: 'Buxoro kiber-olamida yangi afsona. G\'alabalar makoniga xush kelibsiz!',
    img: '/slide1.png'
  },
  {
    title: 'TEZLIK',
    desc: 'Maksimal FPS va 540Hz monitorlar. Har bir soniya g\'alaba uchun!',
    img: '/slide2.png'
  },
  {
    title: 'KOMFORT',
    desc: 'VIP darajadagi sharoitlar va eng so\'nggi RTX grafikasi.',
    img: '/slide3.png'
  }
];

function FloatingParticles() {
  const particles = Array.from({ length: 12 });
  return (
    <div className="particles-container" style={{ pointerEvents: 'none' }}>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{
            y: Math.random() * window.innerHeight,
            x: Math.random() * window.innerWidth,
            opacity: 0.2,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [null, -100],
            opacity: [0.2, 0.4, 0]
          }}
          transition={{
            duration: Math.random() * 8 + 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

const HOURLY_RATE = 20000;
const MINUTE_RATE = HOURLY_RATE / 60;

const SessionTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState('0m 0s');
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <div style={{ fontSize: 13, fontWeight: 900 }}>{elapsed}</div>;
};

const BillCounter = ({ startTime, price }) => {
  const [bill, setBill] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diffMins = Math.floor((Date.now() - startTime) / 60000);
      setBill(Math.max(7000, Math.floor(diffMins * (price / 60))));
    }, 5000);
    return () => clearInterval(interval);
  }, [startTime, price]);
  return <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--success-green)' }}>{bill.toLocaleString()}</div>;
};

function App() {
  const [computers, setComputers] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `PC-${(i + 1).toString().padStart(2, '0')}`,
      status: 'free',
      startTime: null,
      limitMinutes: null,
      currentCustomer: null,
      dailyStats: { earnings: 0, hours: 0, sessions: 0 },
      history: [],
      reservation: null
    }))
  );
  const [selectedPc, setSelectedPc] = useState(null);
  const [showAddClub, setShowAddClub] = useState(false);
  const [newClubData, setNewClubData] = useState({ name: '', address: '', description: '', coordinates: '' });
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('xgame_user')) || null);
  const [currentTab, setCurrentTab] = useState(() => localStorage.getItem('xgame_tab') || 'home');
  const [superAdminClubs, setSuperAdminClubs] = useState([]);
  const [superAdminStats, setSuperAdminStats] = useState(null);
  const [lang, setLang] = useState('uz');
  const [adminSubTab, setAdminSubTab] = useState('CLUBS');
  const [selectedClub, setSelectedClub] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const API_URL = import.meta.env.VITE_API_URL || '';

  const callAPI = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('xgame_token');
      const isFormData = options.body instanceof FormData;
      const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      if (!isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'API error');
      return data;
    } catch (error) {
      console.error(`🚨 API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  const fetchAdminData = useCallback(async () => {
    try {
      const stats = await callAPI('/api/admin/stats');
      setSuperAdminStats(stats);
      const clubsResponse = await callAPI('/api/admin/clubs');
      setSuperAdminClubs(clubsResponse);
    } catch (e) { console.error(e); }
  }, [API_URL]);

  const handleLogin = async (username, password) => {
    try {
      const data = await callAPI('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.success) {
        localStorage.setItem('xgame_token', data.token);
        localStorage.setItem('xgame_user', JSON.stringify(data.user));
        setUser(data.user);
        if (data.user.role === 'super_admin') setCurrentTab('super_admin');
        else setCurrentTab('home');
      }
    } catch (err) {
      alert('Login yoki parol xato!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('xgame_token');
    localStorage.removeItem('xgame_user');
    setUser(null);
    setCurrentTab('home');
  };

  useEffect(() => {
    if (user?.role === 'super_admin') fetchAdminData();
  }, [user, fetchAdminData]);

  const startSession = async (params = {}) => {
    if (!selectedPc) return;
    try {
      await callAPI('/api/start-session', {
        method: 'POST',
        body: JSON.stringify({ computerId: selectedPc.id, customerName: params.customer || 'GUEST' })
      });
      setComputers(computers.map(c => c.id === selectedPc.id ? { ...c, status: 'busy', startTime: Date.now(), currentCustomer: params.customer || 'GUEST' } : c));
      setSelectedPc(null);
    } catch (err) { alert(err.message); }
  };

  const stopSession = async () => {
    if (!selectedPc) return;
    try {
      await callAPI('/api/stop-session', { method: 'POST', body: JSON.stringify({ computerId: selectedPc.id }) });
      setComputers(computers.map(c => c.id === selectedPc.id ? { ...c, status: 'free', startTime: null, currentCustomer: null } : c));
      setSelectedPc(null);
    } catch (err) { alert(err.message); }
  };

  if (currentTab === 'super_admin' && user?.role === 'super_admin') {
    return (
      <div className="app-container" style={{ background: '#020205', minHeight: '100vh', padding: 20 }}>
        <FloatingParticles />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 35 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(187,0,255,0.1)', border: '1px solid rgba(187,0,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 8, color: 'var(--accent-purple)', fontWeight: 900, fontFamily: "'Syncopate', sans-serif", letterSpacing: 3 }}>NODES // SUPER_ADMIN</div>
              <h1 style={{ fontSize: 24, margin: 0, fontWeight: 900, fontFamily: "'Syncopate', sans-serif" }}>DASHBOARD</h1>
            </div>
          </div>

          {/* 📊 STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(0,255,163,0.2)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>JAMI FOYDA (SUM)</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#00ffa3' }}>{(superAdminStats?.totalRevenue || 0).toLocaleString()}</div>
            </div>
            <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(187,0,255,0.2)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>JAMI FOYDALANUVCHILAR</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#bb00ff' }}>{superAdminStats?.totalUsers || 0}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 25, overflowX: 'auto', paddingBottom: 5 }}>
            {['CLUBS', 'MANAGERS', 'USERS', 'REPORTS'].map(t => (
              <button key={t} onClick={() => setAdminSubTab(t)} className={adminSubTab === t ? 'btn-brand' : 'btn-outline'} style={{ padding: '8px 15px', fontSize: 10, minWidth: 100 }}>{t}</button>
            ))}
          </div>

          {/* 🏢 CLUBS SUB-TAB */}
          {adminSubTab === 'CLUBS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {superAdminClubs.map(club => (
                <div key={club.id} className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15 }}>{club.name}</h4>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{club.address}</div>
                    <div style={{ fontSize: 8, color: club.status === 'active' ? '#00ffa3' : '#ff3b3b', fontWeight: 900, marginTop: 5 }}>{club.status.toUpperCase()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => {
                      setSelectedClub(club);
                      setNewClubData({ name: club.name, address: club.address, description: club.description, coordinates: club.coordinates });
                      setShowAddClub(true);
                    }} style={{ background: 'none', border: 'none', fontSize: 18 }}>✏️</button>
                    <button onClick={() => { if (confirm('Klubni o‘chirasizmi?')) callAPI(`/api/admin/clubs/${club.id}`, { method: 'DELETE' }).then(fetchAdminData) }} style={{ background: 'none', border: 'none', fontSize: 18 }}>🗑️</button>
                  </div>
                </div>
              ))}
              <button className="btn-brand" style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 65, height: 65, borderRadius: '50%', fontSize: 30 }} onClick={() => { setSelectedClub(null); setNewClubData({ name: '', address: '', description: '', coordinates: '' }); setShowAddClub(true); }}>+</button>
            </div>
          )}

          {/* 👤 MANAGERS SUB-TAB */}
          {adminSubTab === 'MANAGERS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="glass-card" style={{ padding: 20, border: '1px solid var(--accent-purple)' }}>
                <h3 style={{ fontSize: 13, color: 'var(--accent-purple)', marginBottom: 15 }}>YANGI MANAGER QO'SHISH</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input placeholder="Username" className="btn-outline" style={{ textAlign: 'left', padding: 15 }} id="mgr_user" />
                  <input placeholder="Password" type="password" className="btn-outline" style={{ textAlign: 'left', padding: 15 }} id="mgr_pass" />
                  <select className="btn-outline" style={{ background: 'transparent', color: 'white', padding: 15 }} id="mgr_club">
                    <option value="">Klubni tanlang</option>
                    {superAdminClubs.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}
                  </select>
                  <button className="btn-brand" style={{ padding: 15 }} onClick={async () => {
                    const username = document.getElementById('mgr_user').value;
                    const password = document.getElementById('mgr_pass').value;
                    const ClubId = document.getElementById('mgr_club').value;
                    if (!username || !password || !ClubId) return alert('Hamma maydonlar to‘ldirilishi shart!');
                    await callAPI('/api/admin/managers', { method: 'POST', body: JSON.stringify({ username, password, ClubId }) });
                    alert('Manager yaratildi! 🔥');
                    fetchAdminData();
                  }}>SAQLASH 💾</button>
                </div>
              </div>
            </div>
          )}

          {/* 👥 USERS SUB-TAB */}
          {adminSubTab === 'USERS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {superAdminStats?.recentUsers?.map(u => (
                <div key={u.id} className="glass-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: u.isBlocked ? '#ff3b3b' : 'white' }}>{u.firstName} (@{u.username})</div>
                    <div style={{ fontSize: 10, color: 'var(--success-green)', fontWeight: 900 }}>{u.balance.toLocaleString()} SUM</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 10 }} onClick={() => {
                      const amt = prompt('Balansga qancha qo‘shilsin?');
                      if (amt) callAPI(`/api/admin/users/${u.id}/balance`, { method: 'PUT', body: JSON.stringify({ amount: amt, action: 'add' }) }).then(fetchAdminData);
                    }}>PUL +</button>
                    <button className="btn-outline" style={{ padding: '8px 12px', fontSize: 10, color: '#ff3b3b' }} onClick={() => {
                      if (confirm(`Userni ${u.isBlocked ? 'blokdan ochish' : 'bloklash'}mi?`))
                        callAPI(`/api/admin/users/${u.id}/block`, { method: 'PUT', body: JSON.stringify({ isBlocked: !u.isBlocked }) }).then(fetchAdminData);
                    }}>{u.isBlocked ? '🔓' : '🚫'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 📊 REPORTS & BROADCAST SUB-TAB */}
          {adminSubTab === 'REPORTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div className="glass-card" style={{ padding: 22, border: '1px solid rgba(0,255,163,0.2)' }}>
                <h3 style={{ fontSize: 13, color: '#00ffa3', marginBottom: 15, fontFamily: "'Syncopate', sans-serif" }}>NEXUS BROADCAST CHANNEL 📡</h3>
                <textarea
                  placeholder="Barcha foydalanuvchilarga yuborish uchun xabar matnini kiriting..."
                  className="btn-outline"
                  style={{ textAlign: 'left', padding: 20, minHeight: 120, fontSize: 13, marginBottom: 15 }}
                  id="broadcast_news"
                />
                <button
                  className="btn-brand"
                  style={{ padding: 18 }}
                  onClick={async () => {
                    const msg = document.getElementById('broadcast_news').value;
                    if (!msg) return alert('Xabar matni kerak!');
                    await callAPI('/api/admin/broadcast', { method: 'POST', body: JSON.stringify({ message: msg }) });
                    alert('Xabar yuborish jarayoni boshlandi! 📡🛰️');
                    document.getElementById('broadcast_news').value = '';
                  }}
                >OMMAVIY YUBORISH (SEND ALL) 🛰️</button>
              </div>

              <div className="glass-card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 12, marginBottom: 15 }}>KLUB DAROMADLARI (30 KUNLIK) 📊</h3>
                {superAdminClubs.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>{c.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--success-green)' }}>{(Math.random() * 5000000 + 2000000).toLocaleString()} SUM</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showAddClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ background: 'rgba(0,0,0,0.98)', zIndex: 10000 }}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="glass-card" style={{ width: '90%', maxWidth: 500, padding: 30, border: '1px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                  <h2 style={{ fontSize: 18, margin: 0, fontFamily: "'Syncopate', sans-serif" }}>YANGI KLUB</h2>
                  <button onClick={() => setShowAddClub(false)} style={{ background: 'none', border: 'none', color: '#ff3b3b', fontSize: 24 }}>&times;</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <input placeholder="Klub nomi" className="btn-outline" style={{ textAlign: 'left', padding: 20 }} value={newClubData.name} onChange={e => setNewClubData({ ...newClubData, name: e.target.value })} />
                  <input placeholder="Manzil" className="btn-outline" style={{ textAlign: 'left', padding: 20 }} value={newClubData.address} onChange={e => setNewClubData({ ...newClubData, address: e.target.value })} />
                  <textarea placeholder="Tavsif" className="btn-outline" style={{ textAlign: 'left', padding: 20, minHeight: 80 }} value={newClubData.description} onChange={e => setNewClubData({ ...newClubData, description: e.target.value })} />
                  <input placeholder="Koordinatalar (40.38, 71.01)" className="btn-outline" style={{ textAlign: 'left', padding: 20 }} value={newClubData.coordinates} onChange={e => setNewClubData({ ...newClubData, coordinates: e.target.value })} />

                  {!selectedClub && (
                    <div style={{ padding: 10, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.2)', fontSize: 10 }}>
                      📸 RASMLAR (JPG/PNG):
                      <input type="file" multiple accept="image/*" style={{ marginTop: 10, display: 'block' }} onChange={e => setNewClubData({ ...newClubData, imagesFiles: e.target.files })} />
                    </div>
                  )}

                  <button className="btn-brand" style={{ padding: 20, marginTop: 10 }} onClick={async () => {
                    const fd = new FormData();
                    fd.append('name', newClubData.name);
                    fd.append('address', newClubData.address);
                    fd.append('description', newClubData.description);
                    fd.append('coordinates', newClubData.coordinates);

                    if (selectedClub) {
                      // UPDATE (PUT)
                      await callAPI(`/api/admin/clubs/${selectedClub.id}`, { method: 'PUT', body: JSON.stringify(newClubData) });
                    } else {
                      // CREATE (POST)
                      if (newClubData.imagesFiles) {
                        for (let i = 0; i < newClubData.imagesFiles.length; i++) fd.append('images', newClubData.imagesFiles[i]);
                      }
                      await callAPI('/api/admin/clubs', { method: 'POST', body: fd });
                    }
                    setShowAddClub(false);
                    fetchAdminData();
                  }}>{selectedClub ? 'SAQLASH' : 'YARATISH'} 🚀</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="app-container">
      <FloatingParticles />
      <div style={{ padding: 20, zIndex: 10, position: 'relative' }}>
        <h1 style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 28, letterSpacing: 4 }}>X-GAME</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 30 }}>
          {computers.map(pc => (
            <motion.div key={pc.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPc(pc)} style={{ padding: 15, borderRadius: 12, background: pc.status === 'free' ? 'rgba(0,255,163,0.1)' : 'rgba(255,59,59,0.1)', border: `1px solid ${pc.status === 'free' ? '#00ffa3' : '#ff3b3b'}`, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 900 }}>{pc.name}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setSelectedPc(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ position: 'fixed', bottom: 0, width: '100%', background: '#0a0812', borderRadius: '40px 40px 0 0', padding: 30 }}>
              <h2 style={{ fontSize: 24, margin: 0 }}>{selectedPc.name}</h2>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedPc.status === 'busy' && (
                  <div style={{ background: 'rgba(0,255,163,0.05)', padding: 15, borderRadius: 15 }}>
                    <SessionTimer startTime={selectedPc.startTime} />
                    <BillCounter startTime={selectedPc.startTime} price={15000} />
                  </div>
                )}
                {selectedPc.status === 'free' ? (
                  <button className="btn-brand" style={{ padding: 20 }} onClick={() => startSession()}>START</button>
                ) : (
                  <button className="btn-outline" style={{ padding: 20, color: '#ff3b3b', borderColor: '#ff3b3b' }} onClick={stopSession}>STOP</button>
                )}
                <button className="btn-outline" style={{ border: 'none' }} onClick={() => setSelectedPc(null)}>CLOSE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>🏠</div>
        <div onClick={() => {
          if (user?.role === 'super_admin') setCurrentTab('super_admin');
          else setShowLogin(true);
        }}>🛡️</div>
        {user ? (
          <div onClick={handleLogout}>🚪</div>
        ) : (
          <div onClick={() => setShowLogin(true)}>🔑</div>
        )}
      </div>

      <AnimatePresence>
        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ background: 'rgba(0,0,0,0.98)', zIndex: 20000 }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="glass-card" style={{ width: '85%', maxWidth: 400, padding: 35, border: '1px solid var(--accent-purple)' }}>
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <div style={{ fontSize: 9, color: 'var(--accent-purple)', fontWeight: 900, letterSpacing: 4, marginBottom: 10 }}>ADMIN ACCESS</div>
                <h2 style={{ fontSize: 22, margin: 0, fontFamily: "'Syncopate', sans-serif" }}>LOGIN</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input placeholder="Username" className="btn-outline" style={{ textAlign: 'left', padding: 22 }} onChange={e => setLoginForm({ ...loginForm, user: e.target.value })} />
                <input type="password" placeholder="Password" className="btn-outline" style={{ textAlign: 'left', padding: 22 }} onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })} />
                <button className="btn-brand" style={{ padding: 22, marginTop: 10 }} onClick={() => {
                  handleLogin(loginForm.user, loginForm.pass);
                  setShowLogin(false);
                }}>ENTER NEXUS 🚀</button>
                <button onClick={() => setShowLogin(false)} style={{ color: 'rgba(255,255,255,0.3)', border: 'none', background: 'none', fontSize: 12 }}>BECK TO HOME</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
