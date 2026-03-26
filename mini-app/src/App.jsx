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
    map: 'ARENA',
    activePcHeader: 'ARENA STATISTIKASI',
    activePcLabel: 'KOMPYUTERLAR AKTIV',
    yourSession: 'HOZIRGI SEANSINGIZ',
    pcStatus: 'HOLATI: FAQOL',
    stopSession: 'SEANSNI YAKUNLASH',
    newsHeader: 'YANGILIKLAR',
    fillingBalance: 'BALANS: ',
    login: 'KIRISH',
    signup: 'RO\'YXATDAN O\'TISH',
    startPlay: 'O\'YINNI BOSHLASH',
    language: 'TILNI TANLASH',
    computers: 'KOMPYUTERLAR',
    status_free: 'BO\'SH',
    status_busy: 'BAND',
    status_locked: 'QULFLANGAN'
  },
  ru: {
    welcome: 'ДОБРО ПОЖАЛОВАТЬ',
    home: 'ГЛАВНАЯ',
    map: 'АРЕНА',
    activePcHeader: 'СТАТИСТИКА АРЕНЫ',
    activePcLabel: 'ПК АКТИВНО',
    yourSession: 'ВАША ТЕКУЩАЯ СЕССИЯ',
    pcStatus: 'СТАТУС: АКТИВЕН',
    stopSession: 'ЗАВЕРШИТЬ СЕССИЮ',
    newsHeader: 'НОВОСТИ',
    fillingBalance: 'БАЛАНС: ',
    login: 'ВХОД',
    signup: 'РЕГИСТРАЦИЯ',
    startPlay: 'НАЧАТЬ ИГРУ',
    language: 'ВЫБОР ЯЗЫКА',
    computers: 'КОМПЬЮТЕРЫ',
    status_free: 'СВОБОДЕН',
    status_busy: 'ЗАНЯТ',
    status_locked: 'ЗАБЛОКИРОВАН'
  }
};

const slides = [
  { title: 'X-GAME', desc: 'Buxoro kiber-olamida yangi afsona.', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' },
  { title: 'TEZLIK', desc: 'Maksimal FPS va 540Hz monitorlar.', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop' },
  { title: 'KOMFORT', desc: 'VIP darajadagi sharoitlar va RTX 4090.', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop' }
];

function FloatingParticles() {
  const particles = useMemo(() => Array.from({ length: 15 }), []);
  return (
    <div className="particles-container">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{ y: Math.random() * 800, x: Math.random() * 400, opacity: 0.1 }}
          animate={{ y: [null, -100], opacity: [0.1, 0.3, 0] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

function App() {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPc, setSelectedPc] = useState(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('xgame_user')) || null);
  const [currentTab, setCurrentTab] = useState('home');
  const [lang, setLang] = useState('uz');
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });

  const API_URL = import.meta.env.VITE_API_URL || '';
  const t = translations[lang];

  const callAPI = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('xgame_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Server xatoligi');
      return data;
    } catch (error) {
      console.error(`🚨 API Error:`, error);
      throw error;
    }
  };

  const fetchComputers = useCallback(async () => {
    try {
      const data = await callAPI('/api/computers');
      setComputers(data);
      setLoading(false);
    } catch (e) { console.error(e); }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await callAPI(`/api/user/${user.id}`);
      setUser(data);
      localStorage.setItem('xgame_user', JSON.stringify(data));
    } catch (e) { console.error(e); }
  }, [user?.id]);

  useEffect(() => {
    fetchComputers();
    fetchUserData();
    const interval = setInterval(fetchComputers, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, [fetchComputers, fetchUserData]);

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
    } catch (err) {
      alert('Login yoki parol xato!');
    }
  };

  const startSession = async () => {
    if (!user) return setShowLogin(true);
    try {
      await callAPI('/api/start-session', {
        method: 'POST',
        body: JSON.stringify({ computerId: selectedPc.id, userId: user.id })
      });
      fetchComputers();
      fetchUserData();
      setSelectedPc(null);
      alert('Seans boshlandi! 🚀');
    } catch (err) { alert(err.message); }
  };

  const stopSession = async () => {
    try {
      await callAPI('/api/stop-session', {
        method: 'POST',
        body: JSON.stringify({ computerId: selectedPc.id })
      });
      fetchComputers();
      fetchUserData();
      setSelectedPc(null);
      alert('Seans yakunlandi! ✅');
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="app-container">
      <FloatingParticles />
      <div className="premium-overlay" />

      {/* 🔝 HEADER */}
      <header style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100 }}>
        <div>
          <h1 style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 24, margin: 0, letterSpacing: 3, background: 'linear-gradient(to right, #fff, #b030ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X-GAME</h1>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: 2 }}>{t.activePcHeader}</div>
        </div>
        <div onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')} style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
          {lang.toUpperCase()}
        </div>
      </header>

      <main style={{ padding: '0 20px 120px', position: 'relative', zIndex: 10 }}>
        {currentTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 🏎️ SLIDER */}
            <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 4000 }} pagination={{ clickable: true }} style={{ borderRadius: 20, height: 180, marginBottom: 25, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              {slides.map((s, i) => (
                <SwiperSlide key={i} style={{ position: 'relative' }}>
                  <img src={s.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  <div style={{ position: absolute, inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.title}</h3>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.desc}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* 👤 USER STATS */}
            {user && (
              <div className="glass-card" style={{ padding: 20, marginBottom: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent-purple)' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800 }}>{t.welcome}, {user.firstName || user.username}</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{user.balance?.toLocaleString()} <span style={{ fontSize: 12, color: 'var(--accent-purple)' }}>SUM</span></div>
                </div>
                <button className="btn-brand" style={{ padding: '10px 15px', fontSize: 10 }}>TOP-UP</button>
              </div>
            )}

            {/* 🕹️ COMPUTERS GRID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{t.computers}</h2>
              <div style={{ fontSize: 10, color: 'var(--success-green)', fontWeight: 800 }}>{computers.filter(c => c.status === 'free').length} {t.status_free}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {loading ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ height: 75, borderRadius: 15, background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s infinite' }} />
              )) : (
                computers.map(pc => (
                  <motion.div
                    key={pc.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPc(pc)}
                    className="pc-node"
                    style={{
                      height: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 5,
                      border: `1px solid ${pc.status === 'free' ? 'rgba(0,255,163,0.1)' : pc.status === 'busy' ? 'rgba(255,59,59,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      background: pc.status === 'free' ? 'rgba(0,255,163,0.02)' : pc.status === 'busy' ? 'rgba(255,59,59,0.05)' : 'rgba(255,255,255,0.01)',
                      boxShadow: pc.status === 'busy' ? 'inset 0 0 15px rgba(255,59,59,0.05)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 900, color: pc.status === 'busy' ? '#ff3b3b' : pc.status === 'free' ? '#00ffa3' : '#555' }}>
                      {pc.name.split('-')[1]}
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: pc.status === 'free' ? '#00ffa3' : pc.status === 'busy' ? '#ff3b3b' : '#333', boxShadow: pc.status === 'free' ? '0 0 10px #00ffa3' : 'none' }} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {currentTab === 'profile' && !user && (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>{t.login}</h2>
            <button className="btn-brand" onClick={() => setShowLogin(true)}>{t.login.toUpperCase()}</button>
          </div>
        )}
      </main>

      {/* 📥 DRAWER (PC DETAILS) */}
      <AnimatePresence>
        {selectedPc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedPc(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="glass-card" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderRadius: '35px 35px 0 0', padding: '35px 30px 50px', zIndex: 1000, borderTop: '2px solid rgba(187,0,255,0.3)' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 25px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
                <div>
                  <h2 style={{ fontSize: 32, margin: 0, fontWeight: 900 }}>{selectedPc.name}</h2>
                  <div style={{ fontSize: 12, color: selectedPc.status === 'free' ? '#00ffa3' : '#ff3b3b', fontWeight: 800, letterSpacing: 1, marginTop: 5 }}>
                    {t[`status_${selectedPc.status}`].toUpperCase()}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '10px 15px', fontSize: 10, fontWeight: 900, color: 'var(--accent-blue)' }}>VIP AREA</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {selectedPc.status === 'free' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      <div className="glass-card" style={{ padding: 15, background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>PRICE / HOUR</div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>15,000 UZS</div>
                      </div>
                      <div className="glass-card" style={{ padding: 15, background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>HARDWARE</div>
                        <div style={{ fontSize: 16, fontWeight: 900 }}>RTX 4070</div>
                      </div>
                    </div>
                    <button className="btn-brand" style={{ padding: 22, fontSize: 16 }} onClick={startSession}>{t.startPlay}</button>
                  </>
                ) : (
                  <>
                    <div className="glass-card" style={{ padding: 20, background: 'rgba(255,59,59,0.05)', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,59,59,0.7)', marginBottom: 5 }}>ACTIVE SESSION</div>
                      <div style={{ fontSize: 24, fontWeight: 900 }}>- - : - -</div>
                    </div>
                    {user && (user.role === 'admin' || user.role === 'super_admin') && (
                      <button className="btn-outline" style={{ padding: 22, color: '#ff3b3b', borderColor: 'rgba(255,59,59,0.3)' }} onClick={stopSession}>{t.stopSession}</button>
                    )}
                  </>
                )}
                <button className="btn-outline" style={{ border: 'none', color: 'var(--text-muted)' }} onClick={() => setSelectedPc(null)}>ORQAGA QAYTISH</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔑 LOGIN MODAL */}
      <AnimatePresence>
        {showLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '85%', maxWidth: 400, padding: 35, border: '1px solid var(--accent-purple)' }}>
              <h2 style={{ fontSize: 22, fontFamily: "'Syncopate', sans-serif", textAlign: 'center', marginBottom: 30 }}>{t.login}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <input placeholder="Username" className="auth-input" style={{ paddingLeft: 20 }} onChange={e => setLoginForm({ ...loginForm, user: e.target.value })} />
                <input type="password" placeholder="Password" className="auth-input" style={{ paddingLeft: 20 }} onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })} />
                <button className="btn-brand" style={{ padding: 20 }} onClick={handleLogin}>KIRISH 🚀</button>
                <button onClick={() => setShowLogin(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12 }}>YOPISH</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧭 NAVIGATION */}
      <nav className="bottom-nav">
        <div className={`nav-item ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>🏠</div>
        <div className={`nav-item ${currentTab === 'map' ? 'active' : ''}`} onClick={() => setCurrentTab('map')}>🕹️</div>
        <div className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => {
          if (user?.role === 'super_admin' || user?.role === 'admin') setCurrentTab('home'); // or admin tab
          else setCurrentTab('profile');
        }}>🛡️</div>
        <div className="nav-item" onClick={() => user ? handleLogout() : setShowLogin(true)}>👤</div>
      </nav>

      <style>{`
        .pc-node {
          border-radius: 18px;
          cursor: pointer;
          backdrop-filter: blur(5px);
          transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .pc-node:hover { transform: translateY(-5px); border-color: var(--accent-purple); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 900; }
        .bottom-nav { position: fixed; bottom: 25px; left: 25px; right: 25px; height: 75px; background: rgba(15,12,25,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 25px; display: flex; align-items: center; justify-content: space-around; z-index: 1000; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
        .nav-item { font-size: 24px; opacity: 0.4; transition: 0.3s; cursor: pointer; }
        .nav-item.active { opacity: 1; transform: scale(1.2); filter: drop-shadow(0 0 10px var(--accent-purple)); }
        @keyframes pulse { 0% { opacity: 0.1; } 50% { opacity: 0.3; } 100% { opacity: 0.1; } }
      `}</style>
    </div>
  );
}

export default App;
