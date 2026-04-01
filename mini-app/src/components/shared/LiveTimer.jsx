import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTashkentTime } from '../../utils/time';

const LiveTimer = ({ showIcon = true, className = "live-clock-badge" }) => {
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={className}>
            {showIcon && <Clock size={14} color="#7000ff" />}
            {formatTashkentTime(time, true)}
        </div>
    );
};

export default React.memo(LiveTimer);
