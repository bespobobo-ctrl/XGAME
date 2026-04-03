import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Monitor, Coffee, UserPlus, Clock, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import { callAPI } from '../../api';
import { formatTashkentTime } from '../../utils/time';

const ManagerKassa = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await callAPI('/api/manager/kassa/history');
            if (Array.isArray(data)) setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const totalKassa = transactions
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <Monitor size={18} color="#7000ff" />;
            case 'bar_sale': return <Coffee size={18} color="#00d1ff" />;
            case 'deposit': return <UserPlus size={18} color="#39ff14" />;
            default: return <Wallet size={18} color="#888" />;
        }
    };

    const getBadgeStyle = (type) => {
        switch (type) {
            case 'order': return { background: 'rgba(112,0,255,0.1)', color: '#7000ff', label: 'PC SEANSI' };
            case 'bar_sale': return { background: 'rgba(0,209,255,0.1)', color: '#00d1ff', label: 'BAR' };
            case 'deposit': return { background: 'rgba(57,255,20,0.1)', color: '#39ff14', label: 'DEPOZIT' };
            default: return { background: 'rgba(255,255,255,0.05)', color: '#888', label: 'TO\'LOV' };
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '950', letterSpacing: '-1.2px' }}>KASSA</h2>
                    <p style={{ color: '#888', fontSize: '13px', margin: '5px 0 0' }}>BUGUNGI DAROMADLAR TARIXI</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchHistory}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                >
                    <RefreshCw size={20} className={loading ? "spin-anim" : ""} />
                </motion.button>
            </div>

            {/* SUMMARY CARD */}
            <div className="premium-glass" style={{ padding: '25px', borderRadius: '28px', marginBottom: '30px', background: 'linear-gradient(135deg, rgba(112,0,255,0.2) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(112,0,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#7000ff' }}>BUGUNGI JAMI TUSHUM</p>
                    <b style={{ fontSize: '32px', color: '#fff', letterSpacing: '-1px' }}>{totalKassa.toLocaleString()} <span style={{ fontSize: '14px', color: '#666' }}>UZS</span></b>
                </div>
                <div style={{ padding: '15px', background: 'rgba(112,0,255,0.1)', borderRadius: '20px' }}>
                    <TrendingUp size={28} color="#7000ff" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading && transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Xabarlar yuklanmoqda...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 40px', opacity: 0.5 }}>
                        <Wallet size={48} style={{ marginBottom: '15px', margin: '0 auto' }} />
                        <h3 style={{ margin: 0 }}>Hozircha bo'sh</h3>
                        <p style={{ fontSize: '13px' }}>Bugungi kassada hali hech qanday amal bajarilmadi.</p>
                    </div>
                ) : (
                    transactions.map((t, idx) => {
                        const badge = getBadgeStyle(t.type);
                        const isPC = t.type === 'order';
                        const isBar = t.type === 'bar_sale';
                        const isDep = t.type === 'deposit';

                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="premium-glass"
                                style={{ padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getIcon(t.type)}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: '950', padding: '2px 8px', borderRadius: '8px', ...badge }}>{badge.label}</span>
                                            <span style={{ fontSize: '10px', color: '#555', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {formatTashkentTime(new Date(t.createdAt))}</span>
                                        </div>
                                        <b style={{ color: '#fff', fontSize: '14px', display: 'block' }}>
                                            {isPC ? (t.description || "PC SEANSI YOPILDI") : isBar ? t.description.replace('Bar: ', '') : t.description}
                                        </b>
                                        {(isPC && t.Session) && (
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#666' }}>
                                                {formatTashkentTime(new Date(t.Session.startTime))} — {formatTashkentTime(new Date(t.Session.endTime))} ({t.Session.guestName || t.User?.username || 'Gost'})
                                            </p>
                                        )}
                                        {isDep && (
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#39ff14' }}>
                                                Foydalanuvchi: {t.User?.username || 'Mijoz'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <b style={{ color: '#39ff14', fontSize: '16px' }}>{t.amount.toLocaleString()}</b>
                                    <span style={{ display: 'block', fontSize: '10px', color: '#444' }}>UZS</span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

export default ManagerKassa;
