import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, ShoppingBag, PlusCircle, Trash2, Edit } from 'lucide-react';
import { callAPI } from '../../api';

const ManagerBar = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');

    const fetchProducts = async () => {
        try {
            const data = await callAPI('/api/manager/bar/products');
            if (Array.isArray(data)) setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await callAPI('/api/manager/bar/products', {
                method: 'POST',
                body: JSON.stringify({ name, price, category, stock })
            });

            if (res.success) {
                setShowAddModal(false);
                setName(''); setPrice(''); setCategory(''); setStock('');
                fetchProducts();
            } else {
                alert(res.error || "Xatolik yuz berdi");
            }
        } catch (error) {
            alert("Ulanishda xatolik");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '20px', paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '950', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coffee size={28} color="#7000ff" /> BAR BO'LIMI
                    </h2>
                    <p style={{ color: '#888', fontSize: '12px', margin: '5px 0 0' }}>Jami mahsulotlar: {products.length} ta</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(true)}
                    style={{ background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', padding: '12px 18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <PlusCircle size={18} /> QO'SHISH
                </motion.button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(57,255,20,0.2)' }}>
                    <ShoppingBag size={24} color="#39ff14" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>SOTUVLAR</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>Bugungi buyurtmalar tez kunda...</p>
                </div>

                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(0,209,255,0.2)' }}>
                    <PlusCircle size={24} color="#00d1ff" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>OMBOR</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>Sotiladigan barcha tovarlar</p>
                </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '15px' }}>MAHSULOTLAR RO'YXATI</h3>

            {loading ? <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>Yuklanmoqda...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Hozircha birorta mahsulot qo'shilmagan.</p>
                        </div>
                    ) : (
                        products.map(p => (
                            <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '45px', height: '45px', background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Coffee size={20} color="#7000ff" />
                                    </div>
                                    <div>
                                        <b style={{ fontSize: '16px', color: '#fff', display: 'block', marginBottom: '4px' }}>{p.name}</b>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <span style={{ fontSize: '11px', color: '#00d1ff', background: 'rgba(0,209,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{p.category}</span>
                                            {p.stock > 0 && <span style={{ fontSize: '11px', color: '#888' }}>Soni: {p.stock}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <b style={{ fontSize: '16px', color: '#39ff14' }}>{p.price.toLocaleString()}</b>
                                    <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px' }}>UZS</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
                    >
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ background: '#0a0a0a', width: '100%', maxWidth: '400px', borderRadius: '35px', padding: '30px', border: '1px solid rgba(112,0,255,0.3)', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px' }}><PlusCircle size={22} color="#7000ff" /> YANGI MAHSULOT</h3>

                            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: '700' }}>NOMI</label>
                                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="Masalan: Fanta 0.5L" style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: '700' }}>NARXI (UZS)</label>
                                        <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: '700' }}>SONI (Ixtiyoriy)</label>
                                        <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '5px', fontWeight: '700' }}>KATEGORIYA</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', background: '#111', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                                        <option value="">Tanlang...</option>
                                        <option value="Ichimlik">🧃 Ichimlik</option>
                                        <option value="Shirinlik">🍫 Shirinlik</option>
                                        <option value="Ovqat">🍔 Fast Food / Ovqat</option>
                                        <option value="Energetik">⚡ Energetik</option>
                                        <option value="Boshqa">📦 Boshqa</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '15px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', cursor: 'pointer' }}>BEKOR</button>
                                    <button type="submit" disabled={!name || !price} style={{ flex: 2, padding: '15px', background: (!name || !price) ? '#222' : 'linear-gradient(45deg, #7000ff, #ff007a)', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '900', cursor: (!name || !price) ? 'not-allowed' : 'pointer' }}>QO'SHISH</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ManagerBar;
