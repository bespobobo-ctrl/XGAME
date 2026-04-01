import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap, AlertTriangle } from 'lucide-react';

const RevenueDashboard = ({ stats }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
            <div className="premium-glass" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '15px' }}>
                <p className="secondary-label">KUNLIK UMUMIY DAROMAD</p>
                <h2 style={{ fontSize: '48px', fontWeight: '950', margin: '5px 0', color: '#fff', letterSpacing: '-1.5px' }}>
                    {Math.round(stats?.revenue?.day || 0).toLocaleString()} UZS
                </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <DashItem label="NAQD KASSA" icon={<Coins size={14} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString() || '0'} />
                <DashItem label="PORTAL" icon={<Zap size={14} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString() || '0'} />
            </div>

            <div style={{ marginTop: '10px' }}>
                <DashItem
                    label="SHTRAF FOYDA"
                    icon={<AlertTriangle size={14} color="#ffaa00" />}
                    value={stats?.revenue?.penaltyProfit?.toLocaleString() || '0'}
                    isWide={true}
                />
            </div>
        </motion.div>
    );
};

const DashItem = ({ label, icon, value, isWide = false }) => (
    <div style={{
        background: 'rgba(255,100,0,0.05)',
        padding: '20px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.04)',
        width: '100%',
        boxSizing: 'border-box'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {icon}<p className="secondary-label" style={{ margin: 0, letterSpacing: '1px', fontSize: '10px' }}>{label}</p>
        </div>
        <b style={{ fontSize: '20px', color: '#fff', fontWeight: '950' }}>{value} <span style={{ fontSize: '10px', color: '#777' }}>UZS</span></b>
    </div>
);

export default RevenueDashboard;
