import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Monitor, Coffee, UserPlus, Clock, RefreshCw, ChevronRight, TrendingUp } from 'lucide-react';
import { callAPI } from '../../api';
import { formatTashkentTime } from '../../utils/time';

const ManagerKassa = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Detailed View State
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

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

    const fetchDetail = async (id) => {
        setDetailLoading(true);
        try {
            const res = await callAPI(`/api/manager/kassa/detail/${id}`);
            if (res) setDetail(res);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
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
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchDetail(t.id)}
                                className="premium-glass"
                                style={{ padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
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
                                            {isPC ? (t.description || "PC SEANSI YOPILDI") : isBar ? (t.description?.replace('Bar: ', '') || 'Bar xaridi') : (t.description || 'Noma\'lum xarid')}
                                        </b>
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

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {detail && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setDetail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="premium-glass"
                            style={{ width: '100%', maxWidth: '380px', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950' }}>TO'LOV TAFSILOTI</h3>
                                <RefreshCw size={18} style={{ color: '#666' }} onClick={() => setDetail(null)} />
                            </div>

                            {detail.user && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', marginBottom: '20px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#7000ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
                                        {detail.user.username[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <b style={{ color: '#fff', fontSize: '16px' }}>{detail.user.username}</b>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#39ff14', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            Balance: <span style={{ fontSize: '14px', fontWeight: '950' }}>{detail.user.balance?.toLocaleString()}</span> UZS
                                        </p>
                                    </div>
                                </div>
                            )}

                            {detail.type === 'session_detail' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                                        <p style={{ margin: '0 0 5px', fontSize: '11px', color: '#666', fontWeight: '900' }}>KOMPYUTER SEANSI</p>
                                        <b style={{ fontSize: '18px', color: '#fff' }}>{detail.session.Computer?.name || 'PC'}</b>
                                        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock size={12} /> {formatTashkentTime(new Date(detail.session.startTime))} — {formatTashkentTime(new Date(detail.session.endTime))}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#666', fontWeight: '900' }}>HARAJATLAR BREAKDOWN</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '13px', color: '#aaa' }}>PC O'yin vaqti narxi:</span>
                                            <b style={{ fontSize: '13px', color: '#fff' }}>{detail.session.totalCost?.toLocaleString()} UZS</b>
                                        </div>

                                        {detail.session.Transactions?.filter(tx => tx.type === 'bar_sale').map(btx => (
                                            <div key={btx.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '12px', color: '#00d1ff' }}>🍔 {btx.description.split('->')[0].replace('Bar: ', '')}</span>
                                                <b style={{ fontSize: '12px', color: '#fff' }}>{btx.amount?.toLocaleString()} UZS</b>
                                            </div>
                                        ))}

                                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '950', color: '#39ff14' }}>JAMI YAKUNIY TO'LOV:</span>
                                            <b style={{ fontSize: '22px', color: '#39ff14', fontWeight: '950' }}>{detail.transaction.amount.toLocaleString()} UZS</b>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'rgba(57,255,20,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                        <TrendingUp color="#39ff14" size={30} />
                                    </div>
                                    <b style={{ fontSize: '28px', color: '#fff', letterSpacing: '-1px' }}>{detail.transaction.amount.toLocaleString()} UZS</b>
                                    <p style={{ color: '#aaa', margin: '10px 0 0', lineHeight: 1.4 }}>{detail.transaction.description}</p>
                                </div>
                            )}

                            <button onClick={() => setDetail(null)} style={{ width: '100%', marginTop: '30px', padding: '18px', borderRadius: '18px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(112,0,255,0.2)' }}>YOPISH / BERKITISH</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

export default ManagerKassa;
