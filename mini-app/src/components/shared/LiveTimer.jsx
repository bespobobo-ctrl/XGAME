import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { formatTashkentTime } from '../../utils/time';

const LiveTimer = () => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const timeStr = formatTashkentTime(time, true);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(112, 0, 255, 0.08)',
                border: '1px solid rgba(112, 0, 255, 0.2)',
                padding: '8px 14px',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
        >
            <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <Clock size={14} color="#7000ff" strokeWidth={2.5} />
            </motion.div>
            <span style={{
                fontSize: '13px',
                fontWeight: '950',
                color: '#fff',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                textShadow: '0 0 10px rgba(112,0,255,0.3)'
            }}>
                {timeStr}
            </span>
        </motion.div>
    );
};

export default React.memo(LiveTimer);
