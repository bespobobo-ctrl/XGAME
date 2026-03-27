'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Key, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mimic API logic (Will connect later)
        setTimeout(() => {
            setLoading(false);
            toast.success('Xush kelibsiz! // ACCESS_GRANTED');
            router.push('/dashboard');
        }, 1500);
    };

    return (
        <main className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#020205]">
            {/* 🔮 Background FX */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md p-8 pt-16 glass-card shadow-2xl"
            >
                {/* 🛡️ Logo Icon */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                        animate={{ boxShadow: ['0 0 20px rgba(187,0,255,0.3)', '0 0 40px rgba(187,0,255,0.6)', '0 0 20px rgba(187,0,255,0.3)'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-20 h-20 rounded-3xl bg-black border border-white/10 flex items-center justify-center p-4"
                    >
                        <Shield className="w-full h-full text-[#bb00ff]" />
                    </motion.div>
                </div>

                {/* 📜 Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] mb-2 font-mono">SAAS_PORTAL</h1>
                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Global Control Nexus // X-GAME 2026</p>
                </div>

                {/* 📝 Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input
                            required
                            placeholder="IDENTIFIER_LOGIN"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pl-14 text-sm font-bold tracking-wider focus:border-[#bb00ff]/50 outline-none transition-all placeholder:text-white/10"
                        />
                    </div>

                    <div className="relative">
                        <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input
                            required
                            type="password"
                            placeholder="ACCESS_PASSPHRASE"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pl-14 text-sm font-bold tracking-wider focus:border-[#00f2ff]/50 outline-none transition-all placeholder:text-white/10"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-6 rounded-2xl bg-gradient-to-r from-purple-600/80 to-blue-500/80 border border-white/10 font-black tracking-[0.3em] text-xs uppercase hover:brightness-125 transition-all flex items-center justify-center gap-4 group"
                    >
                        {loading ? 'SYSTEM_CHECK...' : (
                            <>
                                INITIALIZE_SESSION
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="#" className="text-[10px] font-bold text-white/20 hover:text-white/50 tracking-widest uppercase transition-all">TERMINAL_RECOVERY // FORGOT PASSWORD?</a>
                </div>
            </motion.div>
        </main>
    );
}
