import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { callAPI } from '../api';

const UserDashboard = ({ user, onLogout }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await callAPI('/api/player/me');
                if (res.success) {
                    setProfileData(res);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const qrValue = user?.telegramId ? `tg_${user.telegramId}` : `user_${user?.id}`;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', margin: 0, fontWeight: '900', color: '#fff' }}>CABINET</h2>
                    <p style={{ color: '#00ffcc', margin: 0, fontSize: '13px', letterSpacing: '2px', fontWeight: 'bold' }}>GAMER PROFILE</p>
                </div>
                <button
                    onClick={onLogout}
                    style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.3)', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px' }}
                >
                    CHIQISH
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#00ffcc' }}>Yuklanmoqda... ⏳</div>
            ) : (
                <>
                    {/* ID Card */}
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(112, 0, 255, 0.1) 100%)',
                            border: '1px solid rgba(0, 255, 204, 0.3)',
                            borderRadius: '25px',
                            padding: '25px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            boxShadow: '0 10px 40px rgba(0, 255, 204, 0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative abstract elements */}
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, #00ffcc 0%, transparent 70%)', opacity: 0.2, filter: 'blur(20px)' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', color: '#fff', fontWeight: '900' }}>{profileData?.user?.name || user?.username}</h3>
                                <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{profileData?.user?.clubName?.toUpperCase()}</p>
                            </div>
                            <div style={{ background: '#00ffcc', color: '#000', padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                                VIP MEMBER
                            </div>
                        </div>

                        {/* Balance and Level */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px' }}>HISOB (UZS)</p>
                                <h4 style={{ margin: '5px 0 0', fontSize: '20px', color: '#00ffcc' }}>{profileData?.user?.balance?.toLocaleString() || 0}</h4>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px' }}>DARAJA</p>
                                <h4 style={{ margin: '5px 0 0', fontSize: '18px', color: '#fff' }}>Lv. 1</h4>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px' }}>
                                    <div style={{ width: '30%', height: '100%', background: '#00ffcc', borderRadius: '2px' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Fake Barcode for aesthetic */}
                        <div style={{ background: '#fff', height: '40px', width: '100%', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 10px', boxSizing: 'border-box', opacity: 0.8 }}>
                            {[...Array(30)].map((_, i) => (
                                <div key={i} style={{ width: Math.random() * 4 + 1 + 'px', height: '80%', background: '#000' }}></div>
                            ))}
                        </div>
                        <p style={{ margin: 0, textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '4px' }}>{qrValue.toUpperCase()}</p>
                    </motion.div>

                    {/* Stats & History */}
                    <div style={{ marginTop: '10px' }}>
                        <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>⏱️</span> Oxirgi O'yinlar
                        </h3>

                        {profileData?.recentSessions?.length > 0 ? (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {profileData.recentSessions.map(session => (
                                    <div key={session.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>{session.pc.toUpperCase()}</h4>
                                            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                                {new Date(session.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h4 style={{ margin: 0, color: '#00ffcc', fontSize: '15px' }}>{session.duration} daq</h4>
                                            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                                -{session.cost?.toLocaleString() || 0} sum
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}>🎮</div>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Hali hech qanday o'yin tarixi yo'q.<br />Sizni klubda kutamiz!</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default UserDashboard;
