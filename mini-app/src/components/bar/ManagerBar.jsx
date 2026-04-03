import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, ShoppingBag, PlusCircle } from 'lucide-react';

const ManagerBar = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '20px', paddingBottom: '120px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <Coffee size={48} color="#7000ff" style={{ marginBottom: '10px' }} />
                <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '950', letterSpacing: '-1px' }}>BAR BO'LIMI</h2>
                <p style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>Tez orada foydali kategoriyalar, mahsulotlar hamda buyurtmalar paneli qo'shiladi.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(112,0,255,0.2)' }}>
                    <ShoppingBag size={24} color="#39ff14" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>SOTUVLAR</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>Bugungi savdo aylanmasi</p>
                </div>

                <div className="premium-glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', border: '1px solid rgba(112,0,255,0.2)' }}>
                    <PlusCircle size={24} color="#00d1ff" style={{ marginBottom: '10px' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>MAHSULOT</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '10px', color: '#666' }}>Omborga yangi tovar qo'shish</p>
                </div>
            </div>

            <div style={{
                marginTop: '30px', background: 'rgba(255,255,255,0.02)', padding: '25px',
                borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '950', color: '#fff' }}>Bar tizimi ishlab chiqilmoqda 🚧</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.5' }}>Bu yerda mijozlarga to'g'ridan-to'g'ri PC-dan turib zakaz berish va ularning buyurtmalarini boshqarish imkoniyati bo'ladi.</p>
            </div>
        </motion.div>
    );
};

export default ManagerBar;
