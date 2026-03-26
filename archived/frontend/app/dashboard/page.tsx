'use client';

import { motion } from 'framer-motion';
import { Network, Activity, Gem, TrendingUp, Cpu, Server, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const stats = [
        { label: 'TARMOQ_NODLAR', val: '24', icon: Server, color: '#bb00ff' },
        { label: 'FAOLL_FOYDALANUVCHILAR', val: '1,429', icon: Network, color: '#00f2ff' },
        { label: 'TIZIM_BARQARORLIGI', val: '99.9%', icon: Activity, color: '#00ffa3' },
        { label: 'O\'RTACHA_DAROMAD', val: 'UZS 425k', icon: Gem, color: '#ffcc00' }
    ];

    return (
        <div className="space-y-12">
            {/* 🔮 Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black uppercase tracking-[0.3em] font-mono flex items-center gap-6">
                    NEXUS_CORE OVERVIEW
                    <span className="text-[10px] py-1 px-4 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/30 font-bold tracking-widest uppercase">REALTIME_SYNC</span>
                </h1>
                <p className="text-white/20 text-xs font-bold tracking-[0.2em] font-mono">GLOBAL_NETWORK_STATUS // KOKAND_CLUSTER_XGAME</p>
            </div>

            {/* 📊 High-End Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -10, scale: 1.02 }}
                        className="group glass-card p-10 relative overflow-hidden transition-all duration-500"
                    >
                        {/* BG Aura */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 rounded-full bg-[${s.color}] pointer-events-none`} />

                        <div className="flex items-center justify-between mb-8">
                            <div style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }} className="w-14 h-14 rounded-2xl flex items-center justify-center p-3">
                                <s.icon style={{ color: s.color }} className="w-full h-full drop-shadow-lg" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-white/10 group-hover:text-white/20" />
                        </div>

                        <h3 className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-2 font-mono">{s.label}</h3>
                        <div className="text-3xl font-black uppercase tracking-tight text-white mb-4 font-mono">{s.val}</div>

                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-6">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: 0.5, duration: 2 }}
                                style={{ backgroundColor: s.color }}
                                className="h-full shadow-lg"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🏙️ Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
                {/* Real-time Log Stream (Matrix Style) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Globe className="w-5 h-5 text-accent-blue" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] font-mono underline decoration-accent-blue/50 underline-offset-8">NODE_NETWORK_TELEMETRY</h2>
                        </div>
                        <button className="text-[10px] font-black tracking-widest text-[#00ffa3] hover:underline uppercase transition-all">HISOBOTNI_YUKLASH.PDF</button>
                    </div>

                    <div className="glass-card p-12 h-[500px] flex flex-col gap-6 relative group overflow-hidden border border-white/5">
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-30" />

                        {[
                            { text: 'LINK_ESTABLISHED :: KOKAND_BRANCH_01', type: 'info', time: '15:10:01' },
                            { text: 'USER_REGISTRATION :: #4429_AZIZ_X', type: 'success', time: '15:08:15' },
                            { text: 'PAYMENT_VERIFIED :: UZS 45,000 // NODE_PC_04', type: 'success', time: '15:05:55' },
                            { text: 'ACCESS_DENIED :: UNAUTHORIZED_LOGIN_ATTEMPT [IP: 192.168.1.4]', type: 'error', time: '15:02:10' },
                            { text: 'SYSTEM_MAINTENANCE_COMPLETE :: GLOBAL_GATEWAY', type: 'info', time: '14:55:00' },
                        ].map((log, i) => (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex gap-10 items-start group/log border-b border-white/[0.03] pb-6 last:border-0 hover:bg-white/[0.01] rounded-lg transition-all p-2">
                                <span className="font-mono text-[9px] text-white/20 font-bold whitespace-nowrap pt-1">[{log.time}]</span>
                                <p className={`font-mono text-xs font-bold leading-relaxed tracking-wide ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-[#00ffa3]' : 'text-blue-300'}`}>
                                    <span className="opacity-40 mr-4">SYSTEM_STATUS {'>'}</span>
                                    {log.text}
                                </p>
                            </motion.div>
                        ))}

                        <div className="absolute bottom-8 left-12 text-[9px] font-black text-white/10 tracking-[0.4em] font-mono group-hover:text-white/20 transition-all uppercase underline decoration-white/5 underline-offset-4 cursor-pointer font-mono">ESKI_LOGLARNI_YUKLASH // SCROLL_FOR_MORE</div>
                    </div>
                </div>

                {/* System Health / Right Column */}
                <div className="space-y-10">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] font-mono flex items-center gap-4">
                        <Cpu className="w-5 h-5 text-accent-purple" />
                        TIZIM_HOLATI
                    </h2>

                    <div className="glass-card p-10 space-y-12 bg-gradient-to-br from-white/[0.03] to-transparent">
                        {[
                            { label: 'CPU_PROTSESSOR_YUKI', val: '22%', color: '#00f2ff', percent: 22 },
                            { label: 'DB_KECHIKISH_VAQTI', val: '14ms', color: '#00ffa3', percent: 70 },
                            { label: 'TRAFIK_ISTE\'MOLI', val: '450Mb/s', color: '#bb00ff', percent: 85 },
                        ].map((stat, i) => (
                            <div key={i} className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black tracking-widest font-mono">
                                    <span className="text-white/30 uppercase">{stat.label}</span>
                                    <span style={{ color: stat.color }}>{stat.val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 1.5, delay: i * 0.2 }}
                                        style={{ width: `${stat.percent}%`, backgroundColor: stat.color, transformOrigin: 'left' }}
                                        className="h-full shadow-lg"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link href="/dashboard/clubs">
                        <div className="bg-accent-purple/5 border border-accent-purple/10 rounded-3xl p-8 flex items-center justify-between group cursor-pointer hover:bg-accent-purple/10 transition-all border-dashed mt-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-accent-purple tracking-[0.2em] font-mono uppercase">INITIALIZE_NODE</span>
                                <span className="text-[10px] font-black text-white tracking-[0.1em] uppercase">YANGI_KLUB_QO'SHISH</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center p-2.5 group-hover:rotate-90 transition-transform shadow-[0_0_15px_rgba(187,0,255,0.2)]">
                                <span className="text-xl font-bold">+</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
