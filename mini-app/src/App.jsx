import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Views
import Intro from './views/Intro';
import Home from './views/Home';
import ClubIntro from './views/ClubIntro';
import SuperAdminLogin from './views/SuperAdminLogin';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import ManagerLogin from './views/ManagerLogin';
import ManagerSetup from './views/ManagerSetup';

const App = () => {
  const [view, setView] = useState('intro'); // intro, home, superAdmin, managerSetup, clubIntro
  const [selectedClub, setSelectedClub] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard'); // dashboard, clubs, managers
  const [user, setUser] = useState(null);
  const [showSuperLogin, setShowSuperLogin] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Hidden Super Admin Entry Logic (3s Long Press)
  const startLongPress = () => {
    const timer = setTimeout(() => setShowSuperLogin(true), 3000);
    setLongPressTimer(timer);
  };
  const stopLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
  };

  const handleSuperLogin = (data) => {
    setUser(data.user);
    localStorage.setItem('x-token', data.token);
    setView('superAdmin');
    setShowSuperLogin(false);
  };

  const handleManagerLogin = (data) => {
    setUser(data.user);
    localStorage.setItem('x-token', data.token);
    setView('managerSetup'); // Menejer paneli (Hozircha ManagerSetup, keyin bemalol kengaytiramiz)
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('x-token');
    setView('home');
  };

  return (
    <div className="app-main" style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: '"Outfit", sans-serif' }}>

      {/* 🚀 VIEW 1: INTRO (SPLASH) */}
      <AnimatePresence>
        {view === 'intro' && <Intro onFinish={() => setView('home')} />}
      </AnimatePresence>

      {/* 🛡️ VIEW 2: SUPER ADMIN LOGIN (HIDDEN) */}
      <AnimatePresence>
        {showSuperLogin && <SuperAdminLogin onLogin={handleSuperLogin} onCancel={() => setShowSuperLogin(false)} />}
      </AnimatePresence>

      {/* 🏠 MAIN APPLICATION UI */}
      {view !== 'intro' && (
        <>
          <header className="app-header" style={{ padding: '35px 20px 0px', display: 'flex', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(rgba(5,5,5,1), transparent)' }}>
            <motion.h1
              onMouseDown={startLongPress} onMouseUp={stopLongPress}
              onTouchStart={startLongPress} onTouchEnd={stopLongPress}
              animate={{ textShadow: ['0 0 10px #39ff14', '0 0 30px #39ff14', '0 0 10px #39ff14'] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ margin: 0, fontSize: '40px', fontWeight: '950', letterSpacing: '8px', cursor: 'grab', color: '#fff' }}
            >
              {view === 'superAdmin' ? 'NEXUS' : 'X-GAME'}
            </motion.h1>
          </header>

          <main className="app-content">
            {view === 'home' && (
              <Home onClubSelect={(club) => {
                setSelectedClub(club);
                setView('clubIntro');
              }} />
            )}
            {view === 'clubIntro' && (
              <ClubIntro
                club={selectedClub}
                onFinish={() => setView('managerSetup')}
                onBack={() => setView('home')}
              />
            )}
            {view === 'superAdmin' && <SuperAdminDashboard activeTab={adminTab} />}
            {view === 'managerLogin' && <ManagerLogin onLogin={handleManagerLogin} onBack={() => setView('home')} />}
            {view === 'managerSetup' && <ManagerSetup onFinish={() => setView('home')} />}
          </main>

          {/* 👤 NAVIGATION BARS */}
          <AnimatePresence>
            {view === 'superAdmin' ? (
              /* 🛰️ SUPER ADMIN NAVIGATION (ISOLATED) */
              <motion.nav
                initial={{ y: 100 }} animate={{ y: 0 }}
                style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(57, 255, 20, 0.08)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: '15px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100, boxShadow: '0 0 30px rgba(57,255,20,0.1)' }}
              >
                <div onClick={() => setAdminTab('dashboard')} style={{ fontSize: '14px', fontWeight: 'bold', color: adminTab === 'dashboard' ? '#39ff14' : '#fff' }}>🛰️ Stat</div>
                <div onClick={() => setAdminTab('clubs')} style={{ fontSize: '14px', fontWeight: 'bold', color: adminTab === 'clubs' ? '#39ff14' : '#fff' }}>🏛️ Klub</div>
                <div onClick={() => setAdminTab('managers')} style={{ fontSize: '14px', fontWeight: 'bold', color: adminTab === 'managers' ? '#39ff14' : '#fff' }}>👤 Menejer</div>
                <div onClick={logout} style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4444' }}>🚪 Chiqish</div>
              </motion.nav>
            ) : (
              /* 🎮 USER/MANAGER NAVIGATION */
              <motion.nav
                initial={{ y: 100 }} animate={{ y: 0 }}
                style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.1)', padding: '15px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100 }}
              >
                <div onClick={() => setView('home')} style={{ fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', color: view === 'home' ? '#39ff14' : 'rgba(255,255,255,0.3)', textShadow: view === 'home' ? '0 0 10px #39ff14' : 'none', transition: '0.3s' }}>🏠 Asosiy</div>
                <div onClick={() => setView('managerLogin')} style={{ fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', color: (view === 'managerLogin' || view === 'managerSetup') ? '#7000ff' : 'rgba(255,255,255,0.3)', textShadow: (view === 'managerLogin' || view === 'managerSetup') ? '0 0 15px #7000ff' : 'none', transition: '0.3s' }}>👤 Profil</div>
              </motion.nav>
            )}
          </AnimatePresence>
        </>
      )}

      <style>{`
        body { 
          margin: 0; 
          background: #050505; 
          -webkit-tap-highlight-color: transparent; 
          overflow-x: hidden;
          overflow-y: auto; 
        }
        .app-main { 
          display: flex; 
          flex-direction: column; 
          min-height: 100vh; 
        }
        .app-content {
          flex: 1;
          overflow-y: auto;
        }
        .btn-brand { transition: all 0.3s ease; }
        .glass-card { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default App;
