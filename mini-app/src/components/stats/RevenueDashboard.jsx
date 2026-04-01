import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap } from 'lucide-react';

const RevenueDashboard = ({ stats }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '15px' }}>
            <div className="premium-glass" style={{ padding: '30px 20px', textAlign: 'center', marginBottom: '15px' }}>
                <p className="secondary-label">DAILY COMMAND REVENUE</p>
                <h2 style={{ fontSize: '48px', fontWeight: '950', margin: '5px 0', color: '#fff', letterSpacing: '-1.5px' }}>
                    {Math.round(stats?.revenue?.day || 0).toLocaleString()} UZS
                </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <DashItem label="NAQD KASSA" icon={<Coins size={14} color="#7000ff" />} value={stats?.revenue?.cashPcRevenue?.toLocaleString()} />
                <DashItem label="PORTAL" icon={<Zap size={14} color="#39ff14" />} value={stats?.revenue?.userPcRevenue?.toLocaleString()} />
            </div>
        </motion.div>
    );
};

const DashItem = ({ label, icon, value }) => (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {icon}<p className="secondary-label" style={{ margin: 0, letterSpacing: '1px' }}>{label}</p>
        </div>
        <b style={{ fontSize: '18px', color: '#fff', fontWeight: '950' }}>{value}</b>
    </div>
);

export default RevenueDashboard;
