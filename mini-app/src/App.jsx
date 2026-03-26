import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Views
import Intro from './views/Intro';
import Home from './views/Home';
import SuperAdminLogin from './views/SuperAdminLogin';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import ManagerSetup from './views/ManagerSetup';

const App = () => {
  const [view, setView] = useState('intro'); // intro, home, superAdminLogin, superAdmin, managerSetup
  const [user, setUser] = useState(null);
  const [showSuperLogin, setShowSuperLogin] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Hidden Super Admin Entry Logic (Long Press on Header Title)
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

  return (
    <div className="app-main" style={{ minHeight: '100vh', background: '#0a0510', color: '#fff', fontFamily: '"Outfit", sans-serif' }}>

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
          <header className="app-header" style={{ padding: '20px', display: 'flex', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,5,16,0.8)', backdropFilter: 'blur(20px)' }}>
            <h1
              onMouseDown={startLongPress} onMouseUp={stopLongPress}
              onTouchStart={startLongPress} onTouchEnd={stopLongPress}
              style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '2px', cursor: 'grab' }}
            >
              X-GAME
            </h1>
          </header>

          <main className="app-content">
            {view === 'home' && <Home onClubSelect={(club) => console.log('Select:', club)} />}
            {view === 'superAdmin' && <SuperAdminDashboard />}
            {view === 'managerSetup' && <ManagerSetup onFinish={() => setView('home')} />}
          </main>

          {/* 👤 NAVIGATION BAR (Optional) */}
          <nav className="bottom-nav" style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '25px', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(20px)', zIndex: 100 }}>
            <div onClick={() => setView('home')} style={{ fontSize: '20px', opacity: view === 'home' ? 1 : 0.4 }}>🏠 Home</div>
            <div style={{ fontSize: '20px', opacity: 0.4 }}>👤 Profile</div>
          </nav>
        </>
      )}

      <style>{`
        body { margin: 0; background: #0a0510; -webkit-tap-highlight-color: transparent; }
        .btn-brand { transition: all 0.3s ease; }
        .btn-brand:active { transform: scale(0.95); opacity: 0.8; }
        .glass-card { transition: all 0.3s ease; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
