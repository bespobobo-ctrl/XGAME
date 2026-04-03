import { motion } from 'framer-motion';
import { Coins, Zap, AlertTriangle, Monitor, DoorOpen, PlayCircle, Clock, CheckCircle2, Coffee } from 'lucide-react';

const RevenueDashboard = ({ stats }) => {
    const counts = stats?.counts || {};

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
            {/* 💰 REVENUE SECTION */}
            <div className="premium-glass" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '15px', border: '1px solid rgba(112,0,255,0.2)' }}>
                <p className="secondary-label">KUNLIK UMUMIY DAROMAD</p>
                <h2 style={{ fontSize: '48px', fontWeight: '950', margin: '5px 0', color: '#fff', letterSpacing: '-2.5px' }}>
                    {Math.round(stats?.revenue?.day || 0).toLocaleString()} <span style={{ fontSize: '16px', opacity: 0.4 }}>UZS</span>
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <DashItem label="NAQD KASSA" icon={<Coins size={14} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString() || '0'} color="rgba(112,0,255,0.05)" />
                <DashItem label="PORTAL" icon={<Zap size={14} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString() || '0'} color="rgba(57,255,20,0.05)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <DashItem
                    label="SHTRAF FOYDA"
                    icon={<AlertTriangle size={14} color="#ffaa00" />}
                    value={stats?.revenue?.penaltyProfit?.toLocaleString() || '0'}
                    color="rgba(255,170,0,0.05)"
                />
                <DashItem
                    label="BAR HISOBI"
                    icon={<Coffee size={14} color="#00d1ff" />}
                    value={stats?.revenue?.barRevenue?.toLocaleString() || '0'}
                    color="rgba(0,209,255,0.05)"
                />
            </div>

            {/* 🖥️ CLUBS INVENTORY STATS (PREMIUM UI) */}
            <h4 style={{ margin: '25px 0 15px', fontSize: '11px', fontWeight: '950', opacity: 0.4, letterSpacing: '1.5px', textTransform: 'uppercase', paddingLeft: '5px' }}>KLUB HOLATI</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <StatusCard label="JAMI XONALAR" value={counts.totalRooms || 0} icon={<DoorOpen size={20} color="#7000ff" />} color="rgba(112,0,255,0.08)" />
                <StatusCard label="JAMI KOMPYUTERLAR" value={counts.total || 0} icon={<Monitor size={20} color="#00d1ff" />} color="rgba(0,209,255,0.08)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <SmallStatus label="BAND" value={counts.busy || 0} color="#ff007a" icon={<PlayCircle size={14} />} />
                <StatusCard label="BO'SH" value={counts.free || 0} icon={<CheckCircle2 size={16} color="#39ff14" />} color="rgba(57,255,20,0.1)" isThin={true} />
                <SmallStatus label="BRON" value={counts.reserved || 0} color="#ffaa00" icon={<Clock size={14} />} />
            </div>
        </motion.div>
    );
};

const DashItem = ({ label, icon, value, isWide = false, color = 'rgba(255,255,255,0.03)' }) => (
    <div style={{
        background: color,
        padding: '20px',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.04)',
        width: '100%',
        boxSizing: 'border-box'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {icon}<p style={{ margin: 0, fontSize: '10px', fontWeight: '950', opacity: 0.5 }}>{label}</p>
        </div>
        <b style={{ fontSize: '20px', color: '#fff', fontWeight: '950' }}>{value} <span style={{ fontSize: '10px', opacity: 0.3 }}>UZS</span></b>
    </div>
);

const StatusCard = ({ label, value, icon, color, isThin = false }) => (
    <div style={{
        background: color,
        padding: isThin ? '15px' : '20px',
        borderRadius: '25px',
        border: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', gap: '8px',
        boxSizing: 'border-box'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {icon}
            <b style={{ fontSize: '24px', fontWeight: '950' }}>{value}</b>
        </div>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: '950', opacity: 0.5, letterSpacing: '0.5px' }}>{label}</p>
    </div>
);

const SmallStatus = ({ label, value, color, icon }) => (
    <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '15px 10px',
        borderRadius: '22px',
        border: `1px solid ${color}33`,
        textAlign: 'center',
        boxSizing: 'border-box'
    }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginBottom: '5px', opacity: 0.6, color }}>
            {icon}
            <p style={{ margin: 0, fontSize: '8px', fontWeight: '950' }}>{label}</p>
        </div>
        <b style={{ fontSize: '18px', fontWeight: '950', color }}>{value}</b>
    </div>
);

export default RevenueDashboard;
