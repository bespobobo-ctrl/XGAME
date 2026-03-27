'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Map, Settings, LogOut, ShieldCheck, Menu, X, Bell, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    const menuItems = [
        { name: 'NEXUS_OVERVIEW', path: '/dashboard', icon: LayoutDashboard },
        { name: 'CLUSTERS_MANAGEMENT', path: '/dashboard/clubs', icon: Map },
        { name: 'NETWORK_USERS', path: '/dashboard/users', icon: Users },
        { name: 'GLOBAL_STATISTICS', path: '/dashboard/stats', icon: Zap },
        { name: 'SECURITY_VAULT', path: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#020205] text-white flex overflow-hidden">
            {/* 🔮 Background FX */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[15%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[150px] transform -rotate-45" />
                <div className="absolute bottom-[20%] left-[5%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[150px]" />
            </div>

            {/* 🏢 Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 340 : 100 }}
                className="relative z-20 h-screen bg-white/[0.02] border-r border-white/5 backdrop-blur-3xl p-6 transition-all duration-500 overflow-hidden flex flex-col"
            >
                {/* Header/Logo */}
                <div className="flex items-center gap-6 mb-16 mt-4">
                    <div className="min-w-[50px] h-[50px] rounded-2xl bg-gradient-to-br from-[#bb00ff] to-[#00f2ff] flex items-center justify-center p-2.5 shadow-[0_0_20px_rgba(187,0,255,0.3)]">
                        <ShieldCheck className="w-full h-full text-white" />
                    </div>
                    <AnimatePresence>
                        {sidebarOpen && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col">
                                <h1 className="text-xl font-black uppercase tracking-[0.2em] font-mono leading-none">XGAME_OS</h1>
                                <span className="text-[8px] font-bold text-accent-purple tracking-[0.4em] uppercase mt-2">Core System // Ver 4.0</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 space-y-3">
                    {menuItems.map((item) => {
                        const active = pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link key={item.path} href={item.path}>
                                <div className={`sidebar-item group ${active ? 'active' : ''}`}>
                                    <Icon className={`w-6 h-6 transition-colors ${active ? 'text-accent-purple' : 'group-hover:text-white'}`} />
                                    {sidebarOpen && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">{item.name}</span>
                                    )}
                                    {active && sidebarOpen && (
                                        <motion.div layoutId="activeInd" className="absolute right-6 w-2 h-2 rounded-full bg-accent-purple shadow-[0_0_10px_#bb00ff]" />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="pt-8 border-t border-white/10 mt-auto">
                    <button className="sidebar-item w-full group !text-red-500/50 hover:!text-red-400 hover:!bg-red-500/5 transition-all">
                        <LogOut className="w-6 h-6" />
                        {sidebarOpen && (
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">TERMINATE_ACCESS</span>
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* 🏗️ Main Content Area */}
            <main className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
                {/* Navigation / Header */}
                <header className="h-28 border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-12">
                    <div className="flex items-center gap-8">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/30 tracking-[0.4em] uppercase">Current Workspace //</span>
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] font-mono mt-1 text-accent-blue">KOKAND_NEXUS_CORE</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-white/10 cursor-pointer transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex flex-col pr-2">
                                <span className="text-[7px] font-black text-white/30 tracking-[0.2em] uppercase">SYSTEM_ALERTS</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">4 PENDING_EVENTS</span>
                            </div>
                        </div>

                        <div className="w-px h-12 bg-white/10 mx-2" />

                        <div className="flex items-center gap-4 p-2 bg-white/5 rounded-3xl border border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#bb00ff] to-blue-500 p-0.5 shadow-lg shadow-purple-900/40">
                                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center p-2 overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Admin" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                                </div>
                            </div>
                            <div className="flex flex-col pr-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-green">SUPER_USER</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/40">MASTERID: #777</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Children Container */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {children}
                </div>
            </main>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(187,0,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(187,0,255,0.3); }
      `}</style>
        </div>
    );
}
