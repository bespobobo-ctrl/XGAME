import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Wallet, History, Phone, ShieldCheck } from 'lucide-react';
import { callAPI } from '../../api';

const ManageUsers = ({ stats }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [topupAmount, setTopupAmount] = useState('');
    const [userDetails, setUserDetails] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'

    const fetchUsers = async (query = '') => {
        setLoading(true);
        try {
            const data = await callAPI(`/api/manager/users?search=${query}`);
            if (Array.isArray(data)) setUsers(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => fetchUsers(search), 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

    const fetchUserDetails = async (userId) => {
        const data = await callAPI(`/api/manager/user/${userId}/details`);
        if (data && !data.error) {
            setUserDetails(data);
            setViewMode('details');
        }
    };

    const handleTopup = async () => {
        if (!userDetails?.user || !topupAmount) return;
        try {
            const res = await callAPI(`/api/manager/user/${userDetails.user.id}/balance`, {
                method: 'POST',
                body: JSON.stringify({ amount: topupAmount })
            });
            if (res.success) {
                alert(`Muvaffaqiyatli! Yangi balans: ${res.newBalance} UZS`);
                fetchUsers(search);
                fetchUserDetails(userDetails.user.id);
                setTopupAmount('');
            }
        } catch (e) {
            alert("Xatolik yuz berdi");
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '15px', top: '15px', opacity: 0.3 }} size={20} />
                <input
                    type="text"
                    placeholder="Mijoz ismi yoki Tel..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '15px 15px 15px 45px', color: '#fff', fontSize: '15px', outline: 'none' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map(user => (
                    <motion.div
                        key={user.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fetchUserDetails(user.id)}
                        className="premium-glass"
                        style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(45deg, #7000ff, #39ff14)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '950', fontSize: '18px' }}>
                                {user.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '16px' }}>{user.username}</h4>
                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Phone size={10} /> {user.telegramId || 'ID yo\'q'}
                                </p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <b style={{ color: '#39ff14', fontSize: '16px' }}>{user.balance?.toLocaleString()}</b>
                            <p style={{ margin: 0, fontSize: '9px', opacity: 0.5 }}>UZS</p>
                        </div>
                    </motion.div>
                ))}
                {!loading && users.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>Foydalanuvchi topilmadi</div>
                )}
            </div>

            {/* User Details & Topup Modal */}
            <AnimatePresence>
                {viewMode === 'details' && userDetails && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: '0px' }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', background: '#0a0a0a', borderRadius: '40px 40px 0 0', padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', position: 'relative' }}>

                            {/* Close Button */}
                            <button onClick={() => setViewMode('list')} style={{ position: 'absolute', top: '25px', right: '25px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>×</button>

                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '25px', background: 'linear-gradient(45deg, #7000ff, #39ff14)', margin: '0 auto 15px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: '950' }}>{userDetails.user.username[0].toUpperCase()}</div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '950' }}>{userDetails.user.username}</h2>
                                <p style={{ margin: '5px 0', opacity: 0.5, fontSize: '14px' }}>Telegram ID: {userDetails.user.telegramId || 'Mavjud emas'}</p>
                            </div>

                            {/* Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, fontWeight: '950' }}>RO'YHATDAN O'TGAN</p>
                                    <b style={{ fontSize: '13px' }}>{new Date(userDetails.user.createdAt).toLocaleDateString()}</b>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, fontWeight: '950' }}>TEL RAQAM</p>
                                    <b style={{ fontSize: '13px' }}>{userDetails.user.phone || 'Kiritilmagan'}</b>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, fontWeight: '950' }}>BRON ORQALI KELGAN</p>
                                    <b style={{ fontSize: '16px', color: '#7000ff' }}>{userDetails.stats.withReserve} <small style={{ fontSize: '10px' }}>marta</small></b>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.4, fontWeight: '950' }}>BRONSIZ KELGAN</p>
                                    <b style={{ fontSize: '16px', color: '#39ff14' }}>{userDetails.stats.withoutReserve} <small style={{ fontSize: '10px' }}>marta</small></b>
                                </div>
                            </div>

                            {/* Penalty History */}
                            {userDetails.penalties && userDetails.penalties.length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '12px', opacity: 0.5 }}>SHTARAFLAR TARIXI (NO-SHOW)</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {userDetails.penalties.map(p => (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,68,68,0.05)', padding: '10px 15px', borderRadius: '15px', border: '1px solid rgba(255,68,68,0.1)' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>Shtarf: Bron bekor qilindi</p>
                                                    <p style={{ margin: 0, fontSize: '9px', opacity: 0.5 }}>{new Date(p.createdAt).toLocaleString()}</p>
                                                </div>
                                                <b style={{ color: '#ff4444' }}>-{p.amount.toLocaleString()} UZS</b>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Topup Section */}
                            <div style={{ background: 'rgba(112,0,255,0.05)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(112,0,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, color: '#7000ff' }}>BALANSNI TO'LDIRISH</h4>
                                    <b style={{ color: '#fff' }}>{userDetails.user.balance.toLocaleString()} UZS</b>
                                </div>
                                <input
                                    type="number"
                                    placeholder="Summani kiriting..."
                                    value={topupAmount}
                                    onChange={e => setTopupAmount(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(112,0,255,0.2)', borderRadius: '15px', padding: '15px', color: '#fff', fontSize: '20px', fontWeight: '950', textAlign: 'center', marginBottom: '15px', outline: 'none' }}
                                />
                                <button
                                    onClick={handleTopup}
                                    style={{ width: '100%', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '18px', padding: '15px', fontSize: '14px', fontWeight: '950', boxShadow: '0 10px 20px rgba(112,0,255,0.2)' }}
                                >
                                    TASDIQLASH ✨
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageUsers;
