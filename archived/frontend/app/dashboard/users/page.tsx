'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Shield, UserCheck, Search, Filter,
    MoreHorizontal, Trash2, Edit2, Lock, Unlock, Mail,
    Smartphone, CreditCard, ChevronDown
} from 'lucide-react';

export default function UsersManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');

    const users = [
        { id: '1', username: 'admin_aziz', fullName: 'Azizbek Karimov', role: 'SUPER_ADMIN', email: 'aziz@gamezone.uz', balance: 0, status: 'ACTIVE' },
        { id: '2', username: 'club_murod', fullName: 'Murodali Oripov', role: 'CLUB_ADMIN', email: 'murod@kokand.uz', balance: 50000, status: 'ACTIVE' },
        { id: '3', username: 'user_gamer', fullName: 'Sanjar Tursunov', role: 'CUSTOMER', email: 'sanjar@mail.uz', balance: 120000, status: 'INACTIVE' },
        { id: '4', username: 'master_admin', fullName: 'Admin Master', role: 'SUPER_ADMIN', email: 'master@gamezone.uz', balance: 0, status: 'ACTIVE' },
    ];

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-12">
            {/* 🔮 Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black uppercase tracking-[0.3em] font-mono flex items-center gap-6">
                        NETWORK_USERS
                        <span className="text-[10px] py-1 px-4 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/30 font-bold tracking-widest hidden sm:inline-block">AUTHORIZED_PERSONNEL</span>
                    </h1>
                    <p className="text-white/20 text-xs font-bold tracking-[0.2em] font-mono">TIZIM FOYDALANUVCHILARI VA ROLLARI BOSHQARUVI</p>
                </div>

                <button className="cyber-button flex items-center gap-4 !px-10">
                    <UserPlus className="w-5 h-5" />
                    YANGI_FOYDALANUVCHI
                </button>
            </div>

            {/* 🔍 Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input
                        type="text"
                        placeholder="USERNAME YOKI FISH BO'YICHA QIDIRISH..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 font-mono text-xs focus:border-accent-purple outline-none transition-all placeholder:text-white/10 uppercase tracking-widest"
                    />
                </div>

                <div className="relative group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full min-h-[64px] bg-white/5 border border-white/10 rounded-2xl pl-16 pr-10 font-mono text-[10px] font-black tracking-widest focus:border-accent-purple outline-none appearance-none cursor-pointer uppercase"
                    >
                        <option value="ALL" className="bg-[#0a0a0f]">BARCHA ROLLARI</option>
                        <option value="SUPER_ADMIN" className="bg-[#0a0a0f]">SUPER_ADMIN</option>
                        <option value="CLUB_ADMIN" className="bg-[#0a0a0f]">CLUB_ADMIN</option>
                        <option value="CUSTOMER" className="bg-[#0a0a0f]">ODDIY FOYDALANUVCHI</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-hover:text-accent-purple transition-colors" />
                </div>

                <div className="glass-card flex items-center justify-center gap-6 px-10">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-accent-purple">{users.length}</span>
                        <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">Total</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-accent-green">{users.filter(u => u.status === 'ACTIVE').length}</span>
                        <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">Active</span>
                    </div>
                </div>
            </div>

            {/* 👥 Users Table */}
            <div className="glass-card overflow-hidden border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-mono">User / Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-mono">Access Level</th>
                                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-mono">Contact Info</th>
                                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-mono">Balance</th>
                                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-mono text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-1 group-hover:scale-110 transition-transform">
                                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black font-mono tracking-tight">{user.username.toUpperCase()}</span>
                                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{user.fullName}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black tracking-widest ${user.role === 'SUPER_ADMIN' ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/30' :
                                                user.role === 'CLUB_ADMIN' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30' :
                                                    'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            <Shield className="w-3 h-3" />
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-white/40 font-mono">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="w-3 h-3 opacity-50" />
                                                +998 90 123 45 67
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 text-sm font-black font-mono">
                                            <CreditCard className="w-4 h-4 text-accent-green opacity-50" />
                                            {user.balance.toLocaleString()}
                                            <span className="text-[10px] text-white/20">UZS</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-white" title="Tahrirlash">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-red-400" title="Bloklash">
                                                <Lock className="w-4 h-4" />
                                            </button>
                                            <button className="p-3 bg-white/5 rounded-xl hover:bg-red-500/10 transition-all text-white/40 hover:text-red-500" title="O'chirish">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center gap-6">
                        <Users className="w-16 h-16 text-white/5" />
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.2em] font-mono">Hech kim topilmadi</h3>
                            <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest font-mono">QIDIRUV PARAMETRLARINI O'ZGARTIRIB KO'RING</p>
                        </div>
                    </div>
                )}

                {/* Pagination Placeholder */}
                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <span className="text-[8px] font-black text-white/10 tracking-[0.4em] uppercase font-mono">Showing 1-4 of 4 authorized_nodes</span>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(n => (
                            <button key={n} className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black font-mono transition-all ${n === 1 ? 'bg-accent-purple text-white shadow-lg' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 2rem;
                }
                .cyber-button {
                    background: linear-gradient(135deg, #bb00ff, #00f2ff);
                    color: white;
                    font-family: monospace;
                    font-size: 10px;
                    border-radius: 1rem;
                    box-shadow: 0 0 20px rgba(187, 0, 255, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .cyber-button:hover {
                    box-shadow: 0 0 40px rgba(187, 0, 255, 0.6);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
