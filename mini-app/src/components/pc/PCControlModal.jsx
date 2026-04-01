import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Contact2, Phone, Clock, Play, Pause, Square } from 'lucide-react';
import { calculateSessionInfo, formatTashkentTime } from '../../utils/time';
import { callAPI } from '../../api';

const PCControlModal = ({
    selectedPC,
    setSelectedPC,
    isReserveMode,
    setIsReserveMode,
    startAmountInput,
    setStartAmountInput,
    resName,
    setResName,
    resPhone,
    setResPhone,
    resTime,
    setResTime,
    handleAction
}) => {
    // For User Search
    const [userSearchText, setUserSearchText] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [localTime, setLocalTime] = useState(Date.now());

    // Isolated timer for modal view - only runs when modal is open
    useEffect(() => {
        if (!selectedPC) return;
        const interval = setInterval(() => setLocalTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [selectedPC]);

    // Handle user search in reservation mode
    useEffect(() => {
        if (isReserveMode && userSearchText.length > 1) {
            // Trigger search
            callAPI(`/api/manager/users?search=${userSearchText}`).then(data => {
                if (Array.isArray(data)) setFoundUsers(data.slice(0, 5));
            });
        } else {
            setFoundUsers([]);
        }
    }, [isReserveMode, userSearchText]);

    if (!selectedPC) return null;

    const onReserveAction = () => {
        handleAction('reserve', null, {
            guestName: selectedUser ? selectedUser.username : resName,
            guestPhone: selectedUser ? (selectedUser.telegramId || 'PHONE') : resPhone,
            userId: selectedUser ? selectedUser.id : null
        });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', backdropFilter: 'blur(30px)' }} onClick={() => { setSelectedPC(null); setIsReserveMode(false); setSelectedUser(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="premium-glass" style={{ width: '100%', maxWidth: '380px', padding: '25px 20px', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div><h1 style={{ margin: 0, fontSize: '32px', fontWeight: '950', letterSpacing: '-1px', color: '#fff' }}>{selectedPC.name}</h1><p className="secondary-label">BOSHQARUV PANELI</p></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                        <button onClick={() => { setSelectedPC(null); setIsReserveMode(false); setSelectedUser(null); }} style={{ background: 'rgba(255,255,255,0.05)', width: '35px', height: '35px', borderRadius: '10px', border: 'none', color: '#fff' }}><X size={18} /></button>
                        <div style={{ fontSize: '10px', color: '#7000ff', fontWeight: '950' }}>{formatTashkentTime(localTime)}</div>
                    </div>
                </div>

                {isReserveMode ? (
                    <div key="reserve-form">
                        {/* 👤 Link to User Search */}
                        <div style={{ position: 'relative', marginBottom: '15px' }}>
                            <Contact2 style={{ position: 'absolute', left: '18px', top: '16px', color: '#7000ff' }} size={20} />
                            <input placeholder="Foydalanuvchi qidirish..." value={userSearchText} onChange={e => { setUserSearchText(e.target.value); setSelectedUser(null); }} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.6)', border: `1px solid ${selectedUser ? '#39ff14' : 'rgba(112,0,255,0.4)'}`, padding: '16px 20px 16px 48px', borderRadius: '15px', color: '#fff', fontSize: '15px', outline: 'none' }} />
                        </div>

                        {/* Search Results Dropdown */}
                        {foundUsers.length > 0 && !selectedUser && (
                            <div style={{ background: '#111', borderRadius: '15px', padding: '10px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {foundUsers.map(u => (
                                    <div key={u.id} onClick={() => { setSelectedUser(u); setUserSearchText(u.username); setFoundUsers([]); }} style={{ padding: '10px', color: '#fff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                        👤 {u.username} ({u.balance?.toLocaleString()} UZS)
                                    </div>
                                ))}
                            </div>
                        )}

                        {!selectedUser && (
                            <>
                                <div style={{ position: 'relative', marginBottom: '15px' }}> <Contact2 style={{ position: 'absolute', left: '18px', top: '16px', color: '#aaa' }} size={20} /> <input placeholder="Yoki yangi mijoz ismi" value={resName} onChange={e => setResName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px 16px 48px', borderRadius: '15px', color: '#fff', fontSize: '15px', outline: 'none' }} /> </div>
                                <div style={{ position: 'relative', marginBottom: '15px' }}> <Phone style={{ position: 'absolute', left: '18px', top: '16px', color: '#aaa' }} size={20} /> <input placeholder="Tel raqami" value={resPhone} onChange={e => setResPhone(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px 16px 48px', borderRadius: '15px', color: '#fff', fontSize: '15px', outline: 'none' }} /> </div>
                            </>
                        )}

                        <div style={{ position: 'relative', marginBottom: '10px' }}> <Clock style={{ position: 'absolute', left: '18px', top: '16px', color: '#7000ff' }} size={20} /> <input type="time" value={resTime} onChange={e => setResTime(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(112,0,255,0.4)', padding: '16px 20px 16px 48px', borderRadius: '15px', color: '#39ff14', fontSize: '16px', fontWeight: 'bold', outline: 'none' }} /> </div>

                        <p style={{ fontSize: '10px', color: '#ffaa00', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>⚠️ Bron uchun 1 soatlik to'lov darhol yechiladi!</p>

                        <motion.button whileTap={{ scale: 0.95 }} onClick={onReserveAction} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '950', boxShadow: '0 0 20px rgba(112,0,255,0.4)' }}>BRON QILISH 🗓️</motion.button>
                    </div>
                ) : (
                    <>
                        {selectedPC.status === 'free' || selectedPC.status === 'reserved' ? (
                            <div key="free-ui">
                                {selectedPC.UpcomingReservations?.[0] && (
                                    <div style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: '15px', padding: '10px', marginBottom: '15px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#ffaa00', fontWeight: '950' }}>⚠️ BU PC BRON QILINGAN: {new Date(selectedPC.UpcomingReservations[0].startTime).getHours()}:{String(new Date(selectedPC.UpcomingReservations[0].startTime).getMinutes()).padStart(2, '0')}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#ffaa00', opacity: 0.8 }}>Mijoz: {selectedPC.UpcomingReservations[0].guestName} ({selectedPC.UpcomingReservations[0].guestPhone})</p>
                                    </div>
                                )}
                                <div style={{ textAlign: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', padding: '25px 15px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <input type="number" placeholder="0" value={startAmountInput} onChange={e => setStartAmountInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: '#39ff14', fontSize: '56px', fontWeight: '950', outline: 'none', textAlign: 'center', letterSpacing: '-2px' }} />
                                    <p className="secondary-label">KIRITISH SUMMASI</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                    <QuickTapBtn label="10K" onClick={() => setStartAmountInput('10000')} className="vibrant-btn-label" />
                                    <QuickTapBtn label="20K" onClick={() => setStartAmountInput('20000')} className="vibrant-btn-label" />
                                    <QuickTapBtn label="1 SOAT" onClick={() => handleAction('start', 60)} className="neon-purple" />
                                    <QuickTapBtn label="2 SOAT" onClick={() => handleAction('start', 120)} className="neon-purple" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px' }}>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsReserveMode(true)} style={{ padding: '18px', borderRadius: '22px', background: 'rgba(255,255,255,0.03)', color: '#999', border: '1px solid rgba(255,255,255,0.08)', fontWeight: '950', fontSize: '13px' }}>BRON QILISH 🗓️</motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('start')} style={{ padding: '18px', borderRadius: '22px', background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', fontWeight: '950', fontSize: '18px' }}>ISHGA TUSHIRISH 🚀</motion.button>
                                </div>
                            </div>
                        ) : (
                            <div key="busy-ui">
                                {(() => {
                                    const info = calculateSessionInfo(selectedPC, selectedPC.roomPrice, localTime);
                                    return (
                                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                            {selectedPC.UpcomingReservations?.[0] && (
                                                <div style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: '15px', padding: '10px', marginBottom: '15px', textAlign: 'center' }}>
                                                    <p style={{ margin: 0, fontSize: '11px', color: '#ffaa00', fontWeight: '950' }}>⚠️ NAVBATDAGI BRON: {new Date(selectedPC.UpcomingReservations[0].startTime).getHours()}:{String(new Date(selectedPC.UpcomingReservations[0].startTime).getMinutes()).padStart(2, '0')}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#ffaa00', opacity: 0.8 }}>Mijoz: {selectedPC.UpcomingReservations[0].guestName}</p>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                                <div className="timer-unit"><b style={{ fontSize: '38px', fontWeight: '950', color: '#fff' }}>{info.time[0]}</b></div>
                                                <span className="timer-dot">:</span>
                                                <div className="timer-unit"><b style={{ fontSize: '38px', fontWeight: '950', color: '#fff' }}>{info.time[1]}</b></div>
                                                <span className="timer-dot">:</span>
                                                <div className="timer-unit"><b style={{ fontSize: '38px', fontWeight: '950', color: '#fff' }}>{info.time[2]}</b></div>
                                            </div>
                                            <p className="secondary-label" style={{ marginBottom: '20px' }}>VAQT ({info.isCountdown ? "QOLDI" : "O'TDI"})</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ textAlign: 'left' }}><p className="secondary-label" style={{ margin: '0 0 5px', fontSize: '9px' }}>NARX</p><b style={{ fontSize: '20px', color: '#39ff14', fontWeight: '950' }}>{parseInt(info.cost).toLocaleString()} <span style={{ fontSize: '10px', color: '#555' }}>UZS</span></b></div>
                                                <div style={{ textAlign: 'right' }}><p className="secondary-label" style={{ margin: '0 0 5px', fontSize: '9px' }}>BOSHLANDI</p><b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{info.startTime || '--:--'}</b></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction(selectedPC.status === 'paused' ? 'resume' : 'pause')} style={{ padding: '20px', borderRadius: '22px', background: '#ffee32', color: '#000', border: 'none', fontWeight: '950', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>{selectedPC.status === 'paused' ? <><Play size={18} fill="#000" /> DAVOM ETISH</> : <><Pause size={18} fill="#000" /> PAUZA</>}</motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAction('stop')} style={{ padding: '20px', borderRadius: '22px', background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)', fontWeight: '950', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Square size={18} fill="#ff4444" /> TO'XTATISH</motion.button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

const QuickTapBtn = ({ label, onClick, className }) => (
    <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '22px', padding: '18px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className={className} style={{ fontSize: '14px', fontWeight: '950' }}>{label}</span>
    </motion.button>
);

export default React.memo(PCControlModal);
