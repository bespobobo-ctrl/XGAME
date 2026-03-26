import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import './index.css';

const translations = {
  uz: {
    welcome: 'XUSH KELIBSIZ',
    home: 'KLUBLAR',
    map: 'ARENA',
    login: 'KIRISH',
    rooms: 'XONALAR',
    computers: 'KOMPYUTERLAR',
    setupTitle: 'KLUBINGIZNI SOZLANG',
    setupDesc: 'Birinchi kirishingiz! Klubingizdagi xona va pc-larni sozlab oling.',
    addRoom: 'XONA QO\'SHISH',
    pcCount: 'PClar soni',
    price: '1 soat narxi',
  },
  ru: {
    welcome: 'ДОБРО ПОЖАЛОВАТЬ',
    home: 'КЛУБЫ',
    map: 'АРЕНА',
    login: 'ВХОД',
    rooms: 'ЗАЛЫ',
    computers: 'КОМПЬЮТЕРЫ',
    setupTitle: 'НАСТРОЙКА КЛУБА',
    setupDesc: 'Ваш первый вход! Настройте залы и ПК вашего клуба.',
    addRoom: 'ДОБАВИТЬ ЗАЛ',
    pcCount: 'Кол-во ПК',
    price: 'Цена за 1 час',
  }
};

function FloatingParticles() {
  const particles = useMemo(() => Array.from({ length: 15 }), []);
  return (
    <div className="particles-container">
      {particles.map((_, i) => (
        <motion.div key={i} className="particle" initial={{ y: Math.random() * 800, x: Math.random() * 400, opacity: 0.1 }} animate={{ y: [null, -100], opacity: [0.1, 0.3, 0] }} transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }} />
      ))}
    </div>
  );
}

function App() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('xgame_user')) || null);
  const [currentTab, setCurrentTab] = useState('home');
  const [lang, setLang] = useState('uz');
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [setupRooms, setSetupRooms] = useState([{ name: '', pcCount: 5, price: 15000 }]);
  const [selectedPc, setSelectedPc] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://long-showing-released-instructor.trycloudflare.com';
  const t = translations[lang];

  const callAPI = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('xgame_token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      if (response.status === 401) handleLogout();
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Xatolik');
      return data;
    } catch (error) { throw error; }
  };

  const fetchClubs = useCallback(async () => {
    try {
      const data = await callAPI('/api/clubs');
      setClubs(data);
      setLoading(false);
    } catch (e) { console.error(e); }
  }, []);

  const fetchClubDetails = async (id) => {
    const data = await callAPI(`/api/clubs/${id}`);
    setSelectedClub(data);
    setSelectedRoom(null);
  };

  const fetchRoomComputers = async (roomId) => {
    const data = await callAPI(`/api/rooms/${roomId}/computers`);
    setComputers(data);
  };

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  const handleLogin = async () => {
    try {
      const data = await callAPI('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginForm.user, password: loginForm.pass })
      });
      localStorage.setItem('xgame_token', data.token);
      localStorage.setItem('xgame_user', JSON.stringify(data.user));
      setUser(data.user);
      setShowLogin(false);
    } catch (err) { alert('Xato login yoki parol!'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('xgame_token');
    localStorage.removeItem('xgame_user');
    setUser(null);
    setCurrentTab('home');
    setSelectedClub(null);
  };

  const submitSetup = async () => {
    try {
      await callAPI('/api/manager/setup', {
        method: 'POST',
        body: JSON.stringify({ rooms: setupRooms })
      });
      alert('Muvaffaqiyatli sozlandi! ✅');
      window.location.reload();
    } catch (err) { alert(err.message); }
  };

  const startSession = async (pcId) => {
    try {
      await callAPI('/api/start-session', { method: 'POST', body: JSON.stringify({ computerId: pcId }) });
      alert('Seans boshlandi! 🚀');
      fetchRoomComputers(selectedRoom.id);
      setSelectedPc(null);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="app-container">
      <FloatingParticles />
      <div className="premium-overlay" />

      {/* HEADER */}
      <header className="main-header">
        <h1 className="brand-title">X-GAME</h1>
        <div className="lang-switcher" onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}>{lang.toUpperCase()}</div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {/* 🏢 VIEW 1: CLUB LIST */}
          {currentTab === 'home' && !selectedClub && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="section-title">{t.home}</h2>
              <div className="clubs-grid">
                {clubs.map(club => (
                  <motion.div key={club.id} className="glass-card club-card-premium" whileTap={{ scale: 0.98 }} onClick={() => fetchClubDetails(club.id)}>
                    <div className="club-image-placeholder">🏛️</div>
                    <div className="club-info">
                      <h3>{club.name}</h3>
                      <p>{club.address}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 🏠 VIEW 2: ROOM LIST (Inside Club) */}
          {currentTab === 'home' && selectedClub && !selectedRoom && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setSelectedClub(null)} className="btn-outline" style={{ padding: '8px 12px' }}>←</button>
                <h2 style={{ margin: 0 }}>{selectedClub.name} {t.rooms}</h2>
              </div>
              <div className="rooms-grid">
                {selectedClub.Rooms?.map(room => (
                  <motion.div key={room.id} className="glass-card room-card" whileTap={{ scale: 0.98 }} onClick={() => { setSelectedRoom(room); fetchRoomComputers(room.id); }}>
                    <div className="room-icon">🛋️</div>
                    <h4>{room.name}</h4>
                    <p>{room.basePrice.toLocaleString()} {t.price}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 🕹️ VIEW 3: COMPUTER LIST (Inside Room) */}
          {currentTab === 'home' && selectedRoom && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setSelectedRoom(null)} className="btn-outline" style={{ padding: '8px 12px' }}>←</button>
                <h2 style={{ margin: 0 }}>{selectedRoom.name}</h2>
              </div>
              <div className="pc-grid-modern">
                {computers.map(pc => (
                  <motion.div key={pc.id} className={`pc-box ${pc.status}`} onClick={() => setSelectedPc(pc)}>
                    <div className="pc-name">{pc.name.split('-')[1]}</div>
                    <div className="pc-dot" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 🛡️ ADMIN PANEL (SUPER ADMIN or MANAGER) */}
          {currentTab === 'admin' && user?.role === 'super_admin' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="super-admin-view">
              <h2 className="section-title">NEXUS COMMAND CENTER 🛰️</h2>

              <div className="glass-card stat-card-wide">
                <div className="stat-label">JAMI KLUBLAR</div>
                <div className="stat-value">{clubs.length}</div>
              </div>

              <div className="admin-actions">
                <button className="btn-brand" onClick={() => setShowAddClub(true)}>YANGI KLUB QO'SHISH 🏛️</button>
              </div>

              <div className="admin-clubs-list">
                {clubs.map(c => (
                  <div key={c.id} className="glass-card admin-club-item">
                    <span>{c.name}</span>
                    <button className="btn-outline" onClick={() => { setSelectedClubForManager(c); setShowAddManager(true); }}>MANAGER +</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentTab === 'admin' && user?.role === 'manager' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="setup-wizard">
              <h2 className="setup-title">{t.setupTitle}</h2>
              <p className="setup-desc">{t.setupDesc}</p>

              <div className="setup-cards">
                {setupRooms.map((r, i) => (
                  <div key={i} className="glass-card setup-card">
                    <input placeholder="Room Name (e.g. VIP)" value={r.name} onChange={e => {
                      const newR = [...setupRooms]; newR[i].name = e.target.value; setSetupRooms(newR);
                    }} className="setup-input" />
                    <div className="setup-row">
                      <div className="setup-group">
                        <label>{t.pcCount}</label>
                        <input type="number" value={r.pcCount} onChange={e => {
                          const newR = [...setupRooms]; newR[i].pcCount = Number(e.target.value); setSetupRooms(newR);
                        }} />
                      </div>
                      <div className="setup-group">
                        <label>{t.price}</label>
                        <input type="number" value={r.price} onChange={e => {
                          const newR = [...setupRooms]; newR[i].price = Number(e.target.value); setSetupRooms(newR);
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn-outline add-room-btn" onClick={() => setSetupRooms([...setupRooms, { name: '', pcCount: 5, price: 15000 }])}>+ {t.addRoom}</button>
                <button className="btn-brand submit-setup" onClick={submitSetup}>SAQLASH VA ISHNI BOSHLASH 🚀</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLogin && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card login-card" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h3>{t.login}</h3>
              <input placeholder="Username" onChange={e => setLoginForm({ ...loginForm, user: e.target.value })} className="auth-input" />
              <input type="password" placeholder="Password" onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })} className="auth-input" />
              <button className="btn-brand" onClick={handleLogin}>KIRISH ⚡</button>
              <button className="btn-text" onClick={() => setShowLogin(false)}>YOPISH</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PC CONTROL MODAL */}
      <AnimatePresence>
        {selectedPc && (
          <motion.div className="modal-overlay" onClick={() => setSelectedPc(null)}>
            <motion.div className="glass-card pc-drawer" onClick={e => e.stopPropagation()}>
              <h2>{selectedPc.name}</h2>
              <div className="pc-details">
                <div className="price-tag">1 soat: {selectedRoom?.basePrice.toLocaleString()} UZS</div>
                {selectedPc.status === 'free' ? (
                  <button className="btn-brand" onClick={() => startSession(selectedPc.id)}>YONDIRISH (ACTIVATE) 🚀</button>
                ) : (
                  <div className="busy-text">KOMPYUTER BAND (BUSY)</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION BAR */}
      <nav className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' ? 'active' : ''}`} onClick={() => { setCurrentTab('home'); setSelectedClub(null); }}>🏠</div>
        <div className={`nav-item ${currentTab === 'admin' ? 'active' : ''}`} onClick={() => {
          if (!user) setShowLogin(true);
          else setCurrentTab('admin');
        }}>🛡️</div>
        <div className="nav-item" onClick={() => user ? handleLogout() : setShowLogin(true)}>👤</div>
      </nav>

      <style>{`
        .clubs-grid, .rooms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        .club-card-premium { padding: 0; overflow: hidden; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .club-image-placeholder { height: 100px; background: var(--brand-gradient); display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .club-info { padding: 12px; }
        .club-info h3 { margin: 0; fontSize: 14px; }
        .club-info p { margin: 5px 0 0; fontSize: 10px; opacity: 0.6; }
        
        .room-card { padding: 20px; text-align: center; border-radius: 20px; }
        .room-icon { font-size: 30px; margin-bottom: 10px; }
        
        .pc-grid-modern { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .pc-box { height: 70px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); }
        .pc-box.free { border-color: var(--success-green); }
        .pc-box.busy { border-color: var(--danger-red); opacity: 0.7; }
        .pc-box .pc-name { font-weight: 900; font-size: 10px; }
        .pc-box .pc-dot { width: 4px; height: 4px; border-radius: 50%; background: #fff; margin-top: 4px; }
        .pc-box.free .pc-dot { background: var(--success-green); box-shadow: 0 0 8px var(--success-green); }
        
        .setup-wizard { padding-bottom: 50px; }
        .setup-card { padding: 20px; margin-bottom: 15px; border: 1px dashed var(--accent-purple); }
        .setup-input { background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.1); width: 100%; color: #fff; padding: 10px 0; margin-bottom: 15px; }
        .setup-row { display: flex; gap: 10px; }
        .setup-group label { display: block; fontSize: 8px; color: var(--text-muted); margin-bottom: 5px; }
        .setup-group input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; padding: 8px; width: 100%; }
        
        .pc-drawer { position: fixed; bottom: 0; left: 0; right: 0; border-radius: 30px 30px 0 0; padding: 30px; border-top: 2px solid var(--accent-purple); }
        .btn-text { background: none; border: none; color: var(--text-muted); margin-top: 15px; }

        .auth-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 15px; border-radius: 12px; color: #fff; margin-bottom: 10px; outline: none; }
      `}</style>
      <div style={{ position: 'fixed', bottom: 10, width: '100%', textAlign: 'center', fontSize: '10px', color: '#ff4d4d', opacity: 0.7 }}>
        Connected to: {API_URL} | v1.5.1
      </div>
    </div>
  );
}

export default App;
