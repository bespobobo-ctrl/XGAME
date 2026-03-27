'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Building2, User, CheckCircle2, ChevronRight, ChevronLeft, Image as ImageIcon, Briefcase, Settings2, Trash2, Edit3, Globe, Activity } from 'lucide-react';

// Steps for Creating a New Cluster
const STEPS = [
    { title: 'ASOSIY MA\'LUMOT', icon: Building2 },
    { title: 'KONFIGURATSIYA', icon: Settings2 },
    { title: 'ADMIN_BIRIKTIRISH', icon: User },
    { title: 'YAKUNIY TEKSHIRUV', icon: CheckCircle2 }
];

export default function ClustersManagement() {
    const [isAdding, setIsAdding] = useState(false);
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        imageUrl: '',
        ownerId: '',
        priority: 0,
        isActive: true
    });
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClusters = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/clubs');
            if (!res.ok) throw new Error('Klub ma\'lumotlarini olishda xato');
            const data = await res.json();
            const activeClubs = Array.isArray(data)
                ? data.filter((club) => club.isActive)
                : [];
            setClusters(activeClubs);
        } catch (err) {
            setError(err.message || 'Server bilan bog\'lanishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClusters();
    }, []);

    const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const handleBack = () => setStep(s => Math.max(s - 1, 0));

    const handleSubmit = async () => {
        try {
            const clubPayload = {
                name: formData.name,
                address: formData.address,
                isActive: formData.isActive,
                priority: formData.priority,
                img: formData.imageUrl || '',
                locationUrl: '',
                price: '20,000',
                description: `Klub yaratildi: ${formData.name}`
            };

            const res = await fetch('/api/admin/clubs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clubPayload),
            });

            if (!res.ok) {
                throw new Error('Klub yaratishda xatolik yuz berdi');
            }

            await fetchClusters();
            setIsAdding(false);
            setStep(0);
            setFormData({ name: '', address: '', imageUrl: '', ownerId: '', priority: 0, isActive: true });
        } catch (err) {
            setError(err.message || 'Klub qo\'shishda xato');
        }
    };

    return (
        <div className="space-y-12">
            {/* 🔮 Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black uppercase tracking-[0.3em] font-mono flex items-center gap-6">
                        CLUSTER_CONTROL
                        <span className="text-[10px] py-1 px-4 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/30 font-bold tracking-widest hidden sm:inline-block">GLOBAL_LINK</span>
                    </h1>
                    <p className="text-white/20 text-xs font-bold tracking-[0.2em] font-mono">TARMOQDAGI BARCHA O'YIN KLUBLARINI BOSHQARISH</p>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="cyber-button flex items-center gap-4 !px-10"
                >
                    <Plus className="w-5 h-5" />
                    YANGI_KLUB_QO'SHISH
                </button>
            </div>

            {/* 📊 Clusters List */}
            {error && <div className="text-red-400 font-bold p-4 bg-red-500/10 rounded-xl">{error}</div>}
            {loading ? (
                <div className="text-white/50 text-sm">Klublar yuklanmoqda...</div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {clusters.length === 0 ? (
                        <div className="text-white/40 text-sm p-8 bg-white/5 rounded-2xl">Hozircha faollashtirilgan klub topilmadi. Super Admin tomonidan yangi klub qo'shilgach, u shu yerda paydo bo'ladi.</div>
                    ) : (
                        clusters.map((cluster, i) => (
                            <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={cluster.id}
                        className="glass-card group p-8 relative overflow-hidden transition-all duration-500 hover:border-accent-purple/40"
                    >
                        {/* Status Glow */}
                        <div className={`absolute -top-12 -right-12 w-48 h-48 blur-[80px] opacity-10 rounded-full ${cluster.status === 'ONLINE' ? 'bg-accent-green' : cluster.status === 'OFFLINE' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />

                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                    <Globe className="w-8 h-8 text-accent-purple" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-xl font-black uppercase tracking-wider font-mono">{cluster.name}</h3>
                                    <div className="flex items-center gap-3 text-white/40 text-[10px] font-bold font-mono uppercase">
                                        <MapPin className="w-3 h-3 text-accent-blue" />
                                        {cluster.address}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${cluster.status === 'ONLINE' ? 'bg-accent-green/10 text-accent-green border-accent-green/30' :
                                        cluster.status === 'OFFLINE' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                    {cluster.status}
                                </span>
                                <span className="text-[8px] font-mono text-white/20">LATEST_SYNC: 2M AGO</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-8 border-y border-white/5 py-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">Nodes</span>
                                <span className="text-lg font-mono font-black">{cluster.nodes} PCs</span>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">Admin</span>
                                <span className="text-lg font-mono font-black">{cluster.owner.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-end">
                                <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">Revenue</span>
                                <span className="text-lg font-mono font-black text-accent-green">UZS 2.4M</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-mono text-[10px] font-black tracking-widest uppercase">
                                <Activity className="w-4 h-4 text-accent-blue" />
                                MONITORING
                            </button>
                            <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-accent-purple/20 hover:border-accent-purple/50 transition-all flex items-center justify-center group-hover:text-accent-purple">
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center justify-center group-hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 🆕 Add Cluster Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl bg-black/80"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="w-full max-w-4xl glass-card relative overflow-hidden border-2 border-accent-purple/20 shadow-[0_0_50px_rgba(187,0,255,0.1)]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-accent-purple/[0.05] to-transparent">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl font-black uppercase tracking-[0.2em] font-mono">INITIALIZE_CLUSTER</h2>
                                    <p className="text-white/30 text-[10px] font-black tracking-widest uppercase font-mono">SYSTEM_NODE_DEPLOYMENT_WIZARD v4.0</p>
                                </div>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="p-3 md:p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white font-mono text-[10px] font-bold"
                                >
                                    BEKOR_QILISH
                                </button>
                            </div>

                            {/* Stepper Progress */}
                            <div className="p-6 md:p-8 pb-4 border-b border-white/5 overflow-x-auto">
                                <div className="flex justify-between relative min-w-[500px] max-w-2xl mx-auto px-4">
                                    <div className="absolute top-[24px] left-0 w-full h-[1px] bg-white/10 -z-10" />
                                    {STEPS.map((s, i) => (
                                        <div key={i} className="flex flex-col items-center gap-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${i === step ? 'bg-accent-purple text-white border-accent-purple shadow-[0_0_20px_rgba(187,0,255,0.5)] scale-110' :
                                                    i < step ? 'bg-accent-green text-black border-accent-green' : 'bg-black/50 text-white/20 border-white/10'
                                                }`}>
                                                {i < step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                            </div>
                                            <span className={`text-[8px] font-black tracking-widest uppercase font-mono whitespace-nowrap ${i === step ? 'text-accent-purple' : 'text-white/20'}`}>
                                                {s.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="p-8 md:p-10 min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        {step === 0 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase font-mono ml-1">Klub Nomi (Cluster ID)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Masalan: KOKAND_MATRIX_01"
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono text-sm focus:border-accent-purple outline-none transition-all placeholder:text-white/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase font-mono ml-1">Manzil (Coordinate)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Masalan: Qo'qon sh., Turkiston ko'chasi"
                                                            value={formData.address}
                                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono text-sm focus:border-accent-purple outline-none transition-all placeholder:text-white/10"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="h-full border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center group hover:border-accent-purple/40 transition-all cursor-pointer bg-white/[0.02]">
                                                        <ImageIcon className="w-12 h-12 text-white/10 mb-4 group-hover:text-accent-purple transition-all" />
                                                        <span className="text-[10px] font-black text-white/30 tracking-widest uppercase font-mono mb-2">Logo Yuklash (Banner)</span>
                                                        <span className="text-[8px] font-bold text-white/10 font-mono uppercase">PNG, JPG (MAX. 5MB)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 1 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-white/30 tracking-widest uppercase font-mono ml-1">Klub Prioriteti</label>
                                                        <select
                                                            value={formData.priority}
                                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                                            className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 font-mono text-sm focus:border-accent-purple outline-none transition-all appearance-none"
                                                        >
                                                            <option value="0" className="bg-[#0a0a0f]">ODDIY (LEVEL_0)</option>
                                                            <option value="1" className="bg-[#0a0a0f]">PREMIUM (LEVEL_1)</option>
                                                            <option value="2" className="bg-[#0a0a0f]">VIP_ELITE (LEVEL_2)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                                        <span className="text-[10px] font-black text-white/30 tracking-widest uppercase font-mono">Faollik Statusi</span>
                                                        <button
                                                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.isActive ? 'bg-accent-green/50 border-accent-green' : 'bg-white/10 border-white/20'} border`}
                                                        >
                                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 ${formData.isActive ? 'right-1 scale-110 shadow-[0_0_10px_#00ffa3]' : 'left-1 scale-90'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="bg-accent-purple/5 p-8 rounded-3xl border border-accent-purple/10 flex flex-col gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                                                            <Briefcase className="w-5 h-5 text-accent-purple" />
                                                        </div>
                                                        <h4 className="text-[10px] font-black tracking-widest uppercase font-mono">Tizim Ko'rsatmasi</h4>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white/40 leading-relaxed font-mono uppercase tracking-widest text-justify">
                                                        Prioritet darajasi klubning umumiy ro'yxatdagi pozitsiyasini va Mini App interfeysidagi ko'rinishini belgilaydi.
                                                        Deploy tugmasi bosilgandan so'ng, tizim yangi ma'lumotlar bazasini va klubning shaxsiy kanalini sozlaydi.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {[
                                                        { id: '1', name: 'Azizbek K.', role: 'CLUB_ADMIN', avatar: '1' },
                                                        { id: '2', name: 'Murodali O.', role: 'MANAGEMENT', avatar: '2' },
                                                        { id: '3', name: 'Sanjar T.', role: 'CLUB_ADMIN', avatar: '3' },
                                                        { id: '4', name: 'Durbek S.', role: 'OWNER', avatar: '4' },
                                                    ].map((user) => (
                                                        <button
                                                            key={user.id}
                                                            onClick={() => setFormData({ ...formData, ownerId: user.id })}
                                                            className={`p-6 rounded-2xl border transition-all flex items-center gap-6 group relative overflow-hidden ${formData.ownerId === user.id ? 'bg-accent-purple/10 border-accent-purple shadow-[0_0_30px_rgba(187,0,255,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <div className="w-14 h-14 rounded-xl bg-white/5 p-1 border border-white/10">
                                                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`} alt="User" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex flex-col text-left gap-1">
                                                                <span className="text-sm font-black font-mono">{user.name.toUpperCase()}</span>
                                                                <span className="text-[8px] font-bold text-white/20 tracking-widest uppercase">{user.role}</span>
                                                            </div>
                                                            {formData.ownerId === user.id && (
                                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center pt-2 pr-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                                </motion.div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-center flex-col items-center gap-4">
                                                    <div className="h-px w-32 bg-white/5" />
                                                    <button className="text-[9px] font-black text-white/20 tracking-[0.3em] font-mono hover:text-accent-purple uppercase transition-all">YANGI_ADMIN_SHAXSINI_QO'SHISH +</button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                                <div className="lg:col-span-2 space-y-8">
                                                    <div className="glass-card p-10 space-y-8 border-dashed border-2">
                                                        <h4 className="text-[10px] font-black text-accent-green tracking-[0.4em] uppercase font-mono flex items-center gap-3">
                                                            <Activity className="w-4 h-4" />
                                                            READY_FOR_DEPLOYMENT
                                                        </h4>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-mono">Klub Nomi</span>
                                                                <span className="text-lg font-black font-mono text-white underline decoration-accent-purple underline-offset-8">
                                                                    {formData.name || 'ANONYMOUS_CLUSTER'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-mono">Mas'ul Shaxs</span>
                                                                <span className="text-lg font-black font-mono text-white">
                                                                    {formData.ownerId ? 'TANLANGAN_FOYDALANUVCHI' : 'ADMIN_YARATISH_KERAK'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-mono">Joylashuv</span>
                                                                <span className="text-xs font-black font-mono text-white/60">
                                                                    {formData.address || 'HUZUR_XUDUDI'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-mono">Priority Node</span>
                                                                <span className="text-xs font-black font-mono text-accent-purple">
                                                                    {formData.priority === 0 ? 'LEVEL_0_STANDARD' : formData.priority === 1 ? 'LEVEL_1_PREMIUM' : 'LEVEL_2_VIP'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="aspect-square glass-card flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white/[0.02] to-transparent border-2 border-accent-green/20">
                                                        <div className="w-24 h-24 rounded-full bg-accent-green/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,163,0.1)]">
                                                            <Globe className="w-12 h-12 text-accent-green animate-pulse" />
                                                        </div>
                                                        <span className="text-[10px] font-black tracking-[0.2em] font-mono text-accent-green uppercase mb-2">System Check Passed</span>
                                                        <span className="text-[8px] font-bold text-white/20 font-mono uppercase">SYNC_READY_v0.9</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 md:p-10 border-t border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl">
                                <button
                                    onClick={handleBack}
                                    disabled={step === 0}
                                    className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all font-mono text-[10px] ${step === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    ORTGA
                                </button>

                                {step === STEPS.length - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        className="cyber-button !px-12 flex items-center gap-4"
                                    >
                                        DEPLOY_CLUSTER
                                        <CheckCircle2 className="w-5 h-5 shadow-lg" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNext}
                                        className="cyber-button !px-12 flex items-center gap-4"
                                    >
                                        KEYINGISI
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                 input, select {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                }
                input:focus {
                    border-color: #bb00ff;
                    box-shadow: 0 0 20px rgba(187, 0, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
