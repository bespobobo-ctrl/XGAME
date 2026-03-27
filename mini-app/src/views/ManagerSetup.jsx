import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const ManagerSetup = ({ onFinish }) => {
    const [setupRooms, setSetupRooms] = useState([{ name: '', pcCount: 10, pricePerHour: 20000, pcSpecs: 'i5 12th, RTX 3060, 16GB RAM' }]);
    const [loading, setLoading] = useState(false);

    const submitSetup = async () => {
        setLoading(true);
        try {
            await callAPI('/api/manager/setup', {
                method: 'POST',
                body: JSON.stringify({ rooms: setupRooms })
            });
            alert('Klubingiz tayyor! 🔥🚀');
            onFinish();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="setup-wizard"
            style={{ padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}
        >
            <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '10px' }}>KLUBINGIZNI SOZLANG 🛠️</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>Infratuzilmani yarating va ishni boshlang!</p>

            <div className="setup-cards" style={{ display: 'grid', gap: '25px' }}>
                {setupRooms.map((r, i) => (
                    <div key={i} className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '35px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ fontSize: '10px', color: '#7000ff', fontWeight: 'bold', letterSpacing: '2px' }}>ROOM #{i + 1}</span>
                            {setupRooms.length > 1 && (
                                <button onClick={() => setSetupRooms(setupRooms.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '16px' }}>&times;</button>
                            )}
                        </div>
                        <input
                            placeholder="Xona Nomi (masalan: VIP 1)"
                            value={r.name}
                            onChange={e => {
                                const newR = [...setupRooms]; newR[i].name = e.target.value; setSetupRooms(newR);
                            }}
                            style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '10px 0', color: '#fff', fontSize: '18px', marginBottom: '20px', outline: 'none' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>PC COUNT</label>
                                <input
                                    type="number" value={r.pcCount}
                                    onChange={e => {
                                        const newR = [...setupRooms]; newR[i].pcCount = Number(e.target.value); setSetupRooms(newR);
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>PRICE / HOUR (UZS)</label>
                                <input
                                    type="number" value={r.pricePerHour}
                                    onChange={e => {
                                        const newR = [...setupRooms]; newR[i].pricePerHour = Number(e.target.value); setSetupRooms(newR);
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>PC SPECIFICATIONS (HARDWARE)</label>
                            <input
                                placeholder="RTX 3060, Intel i5..."
                                value={r.pcSpecs}
                                onChange={e => {
                                    const newR = [...setupRooms]; newR[i].pcSpecs = e.target.value; setSetupRooms(newR);
                                }}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', color: '#fff', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => setSetupRooms([...setupRooms, { name: '', pcCount: 5, pricePerHour: 15000, pcSpecs: '' }])}
                    style={{ width: '100%', background: 'rgba(112, 0, 255, 0.05)', border: '1px dashed rgba(112, 0, 255, 0.3)', padding: '20px', borderRadius: '25px', color: '#7000ff', fontWeight: 'bold', fontSize: '13px' }}
                >
                    + YANA XONA QO'SHISH
                </button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={submitSetup}
                    disabled={loading}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #7000ff 0%, #ff00ff 100%)', border: 'none', padding: '25px', borderRadius: '25px', color: '#fff', fontWeight: '900', fontSize: '16px', marginTop: '20px', boxShadow: '0 10px 30px rgba(112,0,255,0.3)' }}
                >
                    {loading ? 'YUKLANMOQDA...' : 'KLUBNI ISHGA TUSHIRISH 🔥'}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ManagerSetup;
