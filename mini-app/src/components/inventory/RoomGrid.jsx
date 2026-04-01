import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { calculateSessionInfo } from '../../utils/time';
import { callAPI } from '../../api';

const RoomGrid = ({ rooms, selectedViewRoom, setSelectedViewRoom, setSelectedPC, fetchData }) => {
    const [localTime, setLocalTime] = useState(Date.now());

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomForm, setRoomForm] = useState({ name: '', pricePerHour: '', computers: '' });

    // Local timer only for the grid view
    useEffect(() => {
        const interval = setInterval(() => setLocalTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const openAddRoom = () => { setEditingRoom(null); setRoomForm({ name: '', pricePerHour: '', computers: '' }); setIsFormOpen(true); };
    const openEditRoom = (room, e) => { e.stopPropagation(); setEditingRoom(room); setRoomForm({ name: room.name, pricePerHour: room.pricePerHour, computers: '' }); setIsFormOpen(true); };

    const handleDeleteRoom = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Rostdan ham xonani o'chirmoqchimisiz? Undagi kompyuterlar ham o'chib ketadi!")) return;
        const res = await callAPI(`/api/manager/room/${id}`, { method: 'DELETE' });
        if (res.success && fetchData) fetchData();
    };

    const handleSaveRoom = async () => {
        if (!roomForm.name || !roomForm.pricePerHour) return alert("Barcha maydonlarni to'ldiring");
        const url = editingRoom ? `/api/manager/room/${editingRoom.id}` : '/api/manager/rooms';
        const method = editingRoom ? 'PUT' : 'POST';
        const res = await callAPI(url, { method, body: JSON.stringify(roomForm) });
        if (res.success) { setIsFormOpen(false); if (fetchData) fetchData(); }
        else alert(res.error || "Xatolik yuz berdi");
    };

    if (selectedViewRoom) {
        return (
            <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                    <button onClick={() => setSelectedViewRoom(null)} style={{ background: '#0a0a0a', width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '950', color: '#fff' }}>{selectedViewRoom.name?.toUpperCase()}</h1>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '10px' }}>
                    {selectedViewRoom.Computers?.map(pc => {
                        const info = calculateSessionInfo(pc, selectedViewRoom.pricePerHour, localTime);
                        const s = pc.status.toLowerCase();
                        const theme = s === 'busy' ? '#ff00ff' : s === 'paused' ? '#ffee32' : s === 'reserved' ? '#ffaa00' : '#333';
                        return (
                            <motion.div key={pc.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '15px 5px', textAlign: 'center', boxShadow: s !== 'free' && s !== 'offline' ? `0 0 15px ${theme}33` : 'none' }}>
                                <b style={{ fontSize: '13px', display: 'block', marginBottom: '4px', color: '#fff', fontWeight: '900' }}>{pc.name}</b>
                                <span style={{ fontSize: '9px', color: (s !== 'free') ? theme : '#555', fontWeight: '950' }}>{s === 'free' ? 'BO\'SH' : info.time.join(':')}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '15px' }}>

            {/* ADD ROOM BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={openAddRoom} style={{ background: 'linear-gradient(45deg, #7000ff, #a000ff)', borderRadius: '18px', color: '#fff', padding: '12px 25px', fontSize: '12px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 20px rgba(112,0,255,0.4)', letterSpacing: '1px' }}>
                    <Plus size={18} color="#fff" /> YANGI XONA
                </motion.button>
            </div>

            {rooms.map(room => {
                const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                const free = (room.Computers?.length || 0) - busy - reserved;
                return (
                    <motion.div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0, color: '#fff' }}>{room.name?.toUpperCase()}</h3>
                                <p className="secondary-label" style={{ marginTop: '2px' }}>{room.pricePerHour.toLocaleString()} UZS / SOAT</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* EDIT BAR */}
                                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <button onClick={(e) => openEditRoom(room, e)} style={{ background: 'transparent', border: 'none', padding: '6px', color: '#aaa', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                    <button onClick={(e) => handleDeleteRoom(room.id, e)} style={{ background: 'transparent', border: 'none', padding: '6px', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                                <ChevronRight size={22} color="rgba(255,255,255,0.2)" style={{ marginLeft: '5px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', margin: '15px 0' }}>
                            <div style={{ height: '4px', background: '#ff00ff', flex: busy || 0.1, borderRadius: '4px', opacity: busy > 0 ? 1 : 0.1 }} />
                            <div style={{ height: '4px', background: '#ffaa00', flex: reserved || 0.1, borderRadius: '4px', opacity: reserved > 0 ? 1 : 0.1 }} />
                            <div style={{ height: '4px', background: '#39ff14', flex: free || 0.1, borderRadius: '4px', opacity: free > 0 ? 1 : 0.1 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MiniStat color="#ff00ff" count={busy} label="BAND" />
                                <MiniStat color="#ffaa00" count={reserved} label="BRON" />
                                <MiniStat color="#39ff14" count={free} label="BO'SH" />
                            </div>
                            <b style={{ fontSize: '16px', color: '#39ff14', fontWeight: '950' }}>{room.todayRevenue?.toLocaleString()} UZS</b>
                        </div>
                    </motion.div>
                );
            })}

            {/* 🔥 ADD / EDIT ROOM MODAL (GLASSMORPHISM) 🔥 */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', backdropFilter: 'blur(30px)' }} onClick={() => setIsFormOpen(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="premium-glass" style={{ width: '100%', maxWidth: '380px', padding: '30px 20px', borderRadius: '35px', border: '1px solid rgba(112,0,255,0.3)', position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

                            {/* Decorative Neon Splash */}
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#7000ff', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, opacity: 0.4 }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '950', margin: '0 0 25px 0', letterSpacing: '-1px' }}>
                                    {editingRoom ? 'XONANI TAHRIRLASH' : 'YANGI XONA QO\'SHISH'}
                                </h2>

                                <div style={{ display: 'grid', gap: '18px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#999', fontSize: '10px', fontWeight: '950', marginBottom: '8px', letterSpacing: '1px' }}>XONA NOMI (VIP, BOOTCAMP..)</label>
                                        <input placeholder="Masalan: VIP ZAL" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} className="res-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: '#999', fontSize: '10px', fontWeight: '950', marginBottom: '8px', letterSpacing: '1px' }}>1 SOATLIK NARXI (UZS)</label>
                                        <input type="number" placeholder="20000" value={roomForm.pricePerHour} onChange={e => setRoomForm({ ...roomForm, pricePerHour: e.target.value })} className="res-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                    </div>

                                    {!editingRoom && (
                                        <div>
                                            <label style={{ display: 'block', color: '#999', fontSize: '10px', fontWeight: '950', marginBottom: '8px', letterSpacing: '1px' }}>NECHTA PC KIRITILADI? (AVTOMATIK)</label>
                                            <input type="number" placeholder="Misol uchun: 10" value={roomForm.computers} onChange={e => setRoomForm({ ...roomForm, computers: e.target.value })} className="res-input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                            <p style={{ fontSize: '9px', color: '#7000ff', margin: '8px 0 0 0', fontWeight: 'bold' }}>💡 Tizim o'zi avtomat ravishda "PC-1, PC-2" kabi kompyuterlarni yaratadi</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px' }}>
                                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsFormOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px', fontWeight: '950', fontSize: '13px' }}>BEKOR QILISH</motion.button>
                                        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveRoom} style={{ background: 'linear-gradient(45deg, #7000ff, #a000ff)', color: '#fff', border: 'none', padding: '16px', borderRadius: '20px', fontWeight: '950', fontSize: '13px', boxShadow: '0 0 20px rgba(112,0,255,0.4)', letterSpacing: '1px' }}>SAQLASH 🚀</motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

const MiniStat = ({ color, count, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', background: color, borderRadius: '50%', boxShadow: `0 0 8px ${color}` }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: count > 0 ? color : '#333', fontWeight: '950' }}>{count}</span>
            <span style={{ fontSize: '8px', color: '#555', fontWeight: '950' }}>{label}</span>
        </div>
    </div>
);

export default React.memo(RoomGrid);
