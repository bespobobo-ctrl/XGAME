import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const ManagerSetup = ({ onFinish }) => {
    const [setupRooms, setSetupRooms] = useState([{ name: '', pcCount: 5, price: 15000 }]);
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
            style={{ padding: '20px', paddingBottom: '100px' }}
        >
            <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '10px' }}>KLUBINGIZNI SOZLANG 🛠️</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px' }}>Infratuzilmani yarating va ishni boshlang!</p>

            <div className="setup-cards" style={{ display: 'grid', gap: '20px' }}>
                {setupRooms.map((r, i) => (
                    <div key={i} className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '25px', borderRadius: '25px' }}>
                        <input
                            placeholder="Xona Nomi (masalan: VIP 1)"
                            value={r.name}
                            onChange={e => {
                                const newR = [...setupRooms]; newR[i].name = e.target.value; setSetupRooms(newR);
                            }}
                            style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '10px 0', color: '#fff', fontSize: '18px', marginBottom: '20px' }}
                        />
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>KOMPYUTERLAR SONI</label>
                                <input
                                    type="number" value={r.pcCount}
                                    onChange={e => {
                                        const newR = [...setupRooms]; newR[i].pcCount = Number(e.target.value); setSetupRooms(newR);
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: '#fff' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'block' }}>SOATLIK NARX (UZS)</label>
                                <input
                                    type="number" value={r.price}
                                    onChange={e => {
                                        const newR = [...setupRooms]; newR[i].price = Number(e.target.value); setSetupRooms(newR);
                                    }}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: '#fff' }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={() => setSetupRooms([...setupRooms, { name: '', pcCount: 5, price: 15000 }])}
                    style={{ width: '100%', background: 'rgba(112, 0, 255, 0.1)', border: '1px dashed rgba(112, 0, 255, 0.5)', padding: '15px', borderRadius: '20px', color: '#7000ff', fontWeight: 'bold' }}
                >
                    + YANA XONA QO'SHISH
                </button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={submitSetup}
                    disabled={loading}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #ff00ff 0%, #7000ff 100%)', border: 'none', padding: '20px', borderRadius: '20px', color: '#fff', fontWeight: 'bold', fontSize: '16px', marginTop: '20px' }}
                >
                    {loading ? 'SAQLANMOQDA...' : 'SOZLAMALARNI YAKUNLASH 🔥'}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ManagerSetup;
