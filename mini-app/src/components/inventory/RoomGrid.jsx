import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { calculateSessionInfo } from '../../utils/time';

const RoomGrid = ({ rooms, selectedViewRoom, setSelectedViewRoom, setSelectedPC }) => {
    const [localTime, setLocalTime] = useState(Date.now());

    // Local timer only for the grid view
    useEffect(() => {
        const interval = setInterval(() => setLocalTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

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
                            <motion.div key={pc.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedPC({ ...pc, roomPrice: selectedViewRoom.pricePerHour })} style={{ background: 'rgba(255,255,255,0.03)', border: `1.5px solid ${s !== 'free' ? theme : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '15px 5px', textAlign: 'center' }}>
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
            {rooms.map(room => {
                const busy = room.Computers?.filter(pc => pc.status === 'busy' || pc.status === 'paused').length || 0;
                const reserved = room.Computers?.filter(pc => pc.status === 'reserved').length || 0;
                const free = (room.Computers?.length || 0) - busy - reserved;
                return (
                    <motion.div key={room.id} onClick={() => setSelectedViewRoom(room)} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '35px', padding: '24px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0, color: '#fff' }}>{room.name?.toUpperCase()}</h3>
                                <p className="secondary-label" style={{ marginTop: '2px' }}>{room.pricePerHour.toLocaleString()} UZS / SOAT</p>
                            </div>
                            <ChevronRight size={22} color="rgba(255,255,255,0.2)" />
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
