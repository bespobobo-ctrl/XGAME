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

    const handleTopup = async () => {
        if (!selectedUser || !topupAmount) return;
        try {
            const res = await callAPI(`/api/manager/user/${selectedUser.id}/topup`, {
                method: 'POST',
                body: JSON.stringify({ amount: topupAmount })
            });
            if (res.success) {
                alert(`Muvaffaqiyatli! Yangi balans: ${res.newBalance} UZS`);
                fetchUsers(search);
                setSelectedUser(null);
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
                        onClick={() => setSelectedUser(user)}
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

            {/* Topup Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ width: '100%', maxWidth: '500px', background: '#111', borderRadius: '40px 40px 0 0', padding: '30px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h3 style={{ margin: 0 }}>Balansni To'ldirish</h3>
                            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px' }}>×</button>
                        </div>
                        <p style={{ fontSize: '12px', opacity: 0.5, marginBottom: '20px' }}>Mijoz: {selectedUser.username}</p>
                        <input
                            type="number"
                            placeholder="Summani kiriting..."
                            value={topupAmount}
                            onChange={e => setTopupAmount(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '20px', padding: '20px', color: '#fff', fontSize: '24px', fontWeight: '950', textAlign: 'center', marginBottom: '25px' }}
                        />
                        <button
                            onClick={handleTopup}
                            style={{ width: '100%', background: '#7000ff', color: '#fff', border: 'none', borderRadius: '25px', padding: '18px', fontSize: '16px', fontWeight: '950', boxShadow: '0 10px 20px rgba(112,0,255,0.3)' }}
                        >
                            Balansni To'ldirish
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
