import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callAPI } from '../api';

const SuperAdminDashboard = () => {
    const [clubs, setClubs] = useState([]);
    const [showAddClub, setShowAddClub] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', address: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const data = await callAPI('/api/clubs');
            setClubs(data);
        } catch (err) { console.error(err); }
    };

    const handleCreateClub = async () => {
        setLoading(true);
        try {
            await callAPI('/api/clubs', {
                method: 'POST',
                body: JSON.stringify(newClub)
            });
            setShowAddClub(false);
            fetchClubs();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="super-admin-view"
            style={{ padding: '20px', paddingBottom: '100px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#fff', margin: 0 }}>NEXUS COMMAND 🛰️</h2>
                <div style={{ background: '#7000ff22', color: '#7000ff', padding: '10px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>VERSION 1.6.0</div>
            </div>

            <div className="glass-card stat-card-wide" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '25px', marginBottom: '30px' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' }}>JAMI KLUBLAR</div>
                <div style={{ color: '#fff', fontSize: '42px', fontWeight: '900', marginTop: '5px' }}>{clubs.length}</div>
            </div>

            <div className="admin-actions" style={{ marginBottom: '30px' }}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn-brand"
                    onClick={() => setShowAddClub(true)}
                    style={{
                        width: '100%', background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)',
                        border: 'none', borderRadius: '20px', padding: '18px', color: '#fff', fontWeight: 'bold', fontSize: '14px',
                        boxShadow: '0 8px 30px rgba(255, 0, 255, 0.2)'
                    }}
                >
                    YANGI KLUB QO'SHISH 🏛️
                </motion.button>
            </div>

            <div className="admin-clubs-list" style={{ display: 'grid', gap: '15px' }}>
                {clubs.map(c => (
                    <div key={c.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>{c.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '4px' }}>{c.address}</div>
                        </div>
                        <button className="btn-outline" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '10px', color: '#fff', fontSize: '10px' }}>
                            Menejer +
                        </button>
                    </div>
                ))}
            </div>

            {/* ADD CLUB MODAL */}
            <AnimatePresence>
                {showAddClub && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div className="glass-card" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: '400px', background: '#110a1f', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '22px', marginBottom: '20px', textAlign: 'center' }}>Yangi Klub Qutlug' bo'lsin! ✨</h3>
                            <input placeholder="Klub Nomi" onChange={e => setNewClub({ ...newClub, name: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '15px' }} />
                            <input placeholder="Manzili" onChange={e => setNewClub({ ...newClub, address: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', marginBottom: '20px' }} />
                            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCreateClub} disabled={loading} style={{ width: '100%', background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)', border: 'none', padding: '15px', borderRadius: '15px', color: '#fff', fontWeight: 'bold' }}>
                                {loading ? 'YARATILMOQDA...' : 'YARATISH 🏛️'}
                            </motion.button>
                            <button onClick={() => setShowAddClub(false)} style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>YO'Q, KEYINROQ</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SuperAdminDashboard;
