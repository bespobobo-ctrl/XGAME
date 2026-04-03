import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, ShoppingBag, PlusCircle, ShoppingCart, Monitor, Clock, List, LayoutGrid, Trash2, ArrowUpRight } from 'lucide-react';
import { callAPI } from '../../api';
import { formatTashkentTime } from '../../utils/time';

const ManagerBar = ({ rooms = [] }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'history'
    const [history, setHistory] = useState([]);
    const [histLoading, setHistLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');

    // Sell state
    const [sellProduct, setSellProduct] = useState(null);
    const [sellType, setSellType] = useState('pc'); // 'pc' or 'direct'
    const [sellQty, setSellQty] = useState(1);
    const [sellPcId, setSellPcId] = useState('');
    const [sellLoading, setSellLoading] = useState(false);

    // Active PCs
    const activePCs = rooms.flatMap(r => r.Computers || []).filter(pc => pc.status === 'active' || pc.status === 'paused');

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

    const fetchHistory = async () => {
        setHistLoading(true);
        try {
            const data = await callAPI('/api/manager/bar/history');
            if (Array.isArray(data)) setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setHistLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        if (activeTab === 'history') fetchHistory();
    }, [activeTab]);

    const stats = {
        totalItems: products.length,
        outOfStock: products.filter(p => !p.stock || p.stock === 0).length,
        todaySalesCount: history.length,
        todayProfit: history.reduce((acc, sale) => acc + sale.amount, 0)
    };

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

    const handleSell = async (e) => {
        e.preventDefault();
        if (!sellProduct) return;
        if (sellType === 'pc' && !sellPcId) return alert("Kompyuterni tanlang!");

        setSellLoading(true);
        try {
            const res = await callAPI('/api/manager/bar/sell', {
                method: 'POST',
                body: JSON.stringify({
                    productId: sellProduct.id,
                    quantity: sellQty,
                    type: sellType,
                    pcId: sellPcId || null
                })
            });

            if (res.success) {
                setSellProduct(null);
                setSellQty(1);
                setSellPcId('');
                fetchProducts();
            } else {
                alert(res.error || "Xatolik yuz berdi");
            }
        } catch (e) {
            alert("Server ulanish xatosi");
        } finally {
            setSellLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '20px', paddingBottom: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '950', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coffee size={28} color="#7000ff" /> BAR BO'LIMI
                    </h2>
                    <p style={{ color: '#888', fontSize: '12px', margin: '5px 0 0' }}>Jami mahsulotlar: {stats.totalItems} ta</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(true)}
                    style={{ background: '#7000ff', color: '#fff', border: 'none', borderRadius: '15px', padding: '12px 18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <PlusCircle size={18} /> QO'SHISH
                </motion.button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '18px', padding: '6px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={() => setActiveTab('inventory')}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'inventory' ? '#1a1a1a' : 'transparent', color: activeTab === 'inventory' ? '#fff' : '#666', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.3s' }}
                >
                    <LayoutGrid size={16} color={activeTab === 'inventory' ? '#7000ff' : '#666'} /> OMBOR
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'history' ? '#1a1a1a' : 'transparent', color: activeTab === 'history' ? '#fff' : '#666', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.3s' }}
                >
                    <Clock size={16} color={activeTab === 'history' ? '#00d1ff' : '#666'} /> SOTUVLAR
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(57,255,20,0.2)' }}>
                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#666' }}>BUGUNGI DAROMAD</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '950', color: '#39ff14' }}>{stats.todayProfit.toLocaleString()} <span style={{ fontSize: '10px' }}>UZS</span></p>
                </div>
                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(0,209,255,0.2)' }}>
                    <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#666' }}>TUGAGANLAR</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '950', color: stats.outOfStock > 0 ? '#ff007a' : '#00d1ff' }}>{stats.outOfStock} <span style={{ fontSize: '10px' }}>tur</span></p>
                </div>
            </div>

            {activeTab === 'inventory' ? (
                <>
                    <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '15px' }}>MAHSULOTLAR VA QOLDIQLAR</h3>
                    {loading ? <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>Yuklanmoqda...</div> : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                            {products.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Hozircha birorta mahsulot qo'shilmagan.</p>
                                </div>
                            ) : (
                                products.map(p => (
                                    <motion.div
                                        key={p.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { setSellProduct(p); setSellType('pc'); }}
                                        style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '45px', height: '45px', background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Coffee size={20} color={p.stock > 0 ? "#7000ff" : "#555"} />
                                            </div>
                                            <div>
                                                <b style={{ fontSize: '16px', color: '#fff', display: 'block', marginBottom: '4px' }}>{p.name}</b>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: '#00d1ff', background: 'rgba(0,209,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{p.category}</span>
                                                    <span style={{ fontSize: '11px', color: p.stock > 0 ? '#39ff14' : '#ff007a', fontWeight: 'bold' }}>Qoldi: {p.stock || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <b style={{ fontSize: '16px', color: '#fff' }}>{p.price.toLocaleString()}</b>
                                            <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px', display: 'block' }}>UZS</span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#fff', marginBottom: '15px' }}>SOTUVLAR TARIXI (BUGUN)</h3>
                    {histLoading ? <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>Yuklanmoqda...</div> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>Bugun hali mahsulot sotilmadi.</p>
                                </div>
                            ) : history.map(sale => (
                                <div key={sale.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', borderLeft: `4px solid ${sale.status === 'unpaid' ? '#ffaa00' : '#39ff14'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <b style={{ color: '#fff', fontSize: '14px' }}>{sale.description.split('->')[0].replace('Bar: ', '')}</b>
                                            {sale.status === 'unpaid' && <span style={{ fontSize: '8px', background: 'rgba(255,170,0,0.1)', color: '#ffaa00', padding: '2px 6px', borderRadius: '10px' }}>Qarz/PC</span>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '10px', color: '#666' }}><Clock size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {formatTashkentTime(new Date(sale.createdAt))}</span>
                                            <span style={{ fontSize: '10px', color: '#7000ff', fontWeight: 'bold' }}>{sale.description.includes('sessiya') ? 'PC Session' : 'Admin/Naqd'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <b style={{ color: '#39ff14', fontSize: '15px' }}>{sale.amount.toLocaleString()}</b>
                                        <span style={{ display: 'block', fontSize: '9px', color: '#666' }}>UZS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
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

            {/* SELL MODAL */}
            <AnimatePresence>
                {sellProduct && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}
                        onClick={(e) => e.target === e.currentTarget && setSellProduct(null)}
                    >
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ background: '#0a0a0a', width: '100%', borderTopLeftRadius: '35px', borderTopRightRadius: '35px', padding: '30px', borderTop: '1px solid rgba(112,0,255,0.4)', paddingBottom: '90px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: '#fff' }}>{sellProduct.name}</h3>
                                <p style={{ color: '#39ff14', margin: '5px 0 0', fontWeight: '900', fontSize: '18px' }}>{(sellProduct.price * sellQty).toLocaleString()} UZS</p>
                            </div>

                            <div style={{ display: 'flex', background: '#111', borderRadius: '15px', padding: '5px', marginBottom: '20px' }}>
                                <button onClick={() => setSellType('pc')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: sellType === 'pc' ? 'rgba(112,0,255,0.2)' : 'transparent', color: sellType === 'pc' ? '#00d1ff' : '#666', border: 'none', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Monitor size={16} /> PC-ga
                                </button>
                                <button onClick={() => setSellType('direct')} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: sellType === 'direct' ? 'rgba(57,255,20,0.1)' : 'transparent', color: sellType === 'direct' ? '#39ff14' : '#666', border: 'none', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <ShoppingBag size={16} /> Naqd
                                </button>
                            </div>

                            <form onSubmit={handleSell} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {sellType === 'pc' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '700' }}>Qaysi kompyuterga berasiz?</label>
                                        <select required value={sellPcId} onChange={e => setSellPcId(e.target.value)} style={{ width: '100%', background: '#151515', border: '1px solid #333', padding: '18px', borderRadius: '15px', color: '#fff', fontSize: '16px', outline: 'none' }}>
                                            <option value="">Kompyuterni tanlang...</option>
                                            {activePCs.map(pc => (
                                                <option key={pc.id} value={pc.id}>{pc.name} (Hozir o'ynayapti)</option>
                                            ))}
                                        </select>
                                        {activePCs.length === 0 && <p style={{ color: '#ff007a', fontSize: '11px', marginTop: '5px' }}>Hozir hech kim kompyuterda o'ynamayapti!</p>}
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '700' }}>Soni (Ehtiyot bo'ling)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#151515', borderRadius: '15px', border: '1px solid #333', overflow: 'hidden' }}>
                                        <button type="button" onClick={() => setSellQty(Math.max(1, sellQty - 1))} style={{ width: '60px', padding: '15px', background: 'transparent', color: '#fff', border: 'none', fontSize: '20px', cursor: 'pointer' }}>-</button>
                                        <input type="number" readOnly value={sellQty} style={{ flex: 1, background: 'transparent', border: 'none', color: '#00d1ff', fontSize: '22px', fontWeight: '900', textAlign: 'center', width: '100%', outline: 'none' }} />
                                        <button type="button" onClick={() => setSellQty(sellQty + 1)} style={{ width: '60px', padding: '15px', background: 'transparent', color: '#fff', border: 'none', fontSize: '20px', cursor: 'pointer' }}>+</button>
                                    </div>
                                </div>

                                <button type="submit" disabled={sellLoading || (sellType === 'pc' && !sellPcId)} style={{ width: '100%', padding: '18px', background: (sellType === 'pc' && !sellPcId) ? '#222' : 'linear-gradient(45deg, #7000ff, #00d1ff)', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '950', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(112,0,255,0.3)' }}>
                                    {sellLoading ? 'KUTING...' : "SOTISH / ZAKAZ qilish"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ManagerBar;
