/**
 * Format date to Tashkent (GMT+5) 24h format
 */
export const formatTashkentTime = (dateStr, showSeconds = false, nowTime = Date.now()) => {
    if (!dateStr) return '--:--';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: showSeconds ? '2-digit' : undefined,
            timeZone: 'Asia/Tashkent',
            hour12: false
        }).format(date);
    } catch (e) {
        return '--:--';
    }
};

/**
 * High-performance session timer logic
 * Used to calculate live costs and remaining/elapsed time
 */
export const calculateSessionInfo = (pc, roomPrice = 15000, nowTime = Date.now()) => {
    if (!pc) return { time: ["00", "00", "00"], cost: 0, startTime: null };

    // Find active or paused session
    const sessions = pc.Sessions || [];
    const activeSession = sessions.find(s => ['active', 'paused', 'reserved'].includes(s.status));

    if (!activeSession) return { time: ["00", "00", "00"], cost: 0, startTime: null };

    const sTime = activeSession.startTime ? formatTashkentTime(activeSession.startTime) : null;
    const start = new Date(activeSession.startTime);
    const effectiveNow = activeSession.status === 'paused' ? new Date(activeSession.pausedAt || Date.now()) : nowTime;

    const diffSeconds = Math.max(0, Math.floor((effectiveNow - start) / 1000));
    const cost = Math.floor((diffSeconds / 3600) * (roomPrice || 15000));

    if (activeSession.status === 'reserved') return { time: ["--", "--", "--"], cost: 0, startTime: sTime };

    if (activeSession.expectedMinutes) {
        const totalSeconds = activeSession.expectedMinutes * 60;
        const remainingSec = Math.max(0, totalSeconds - diffSeconds);
        return {
            time: [
                Math.floor(remainingSec / 3600).toString().padStart(2, '0'),
                Math.floor((remainingSec % 3600) / 60).toString().padStart(2, '0'),
                (remainingSec % 60).toString().padStart(2, '0')
            ],
            cost,
            isCountdown: true,
            startTime: sTime
        };
    } else {
        return {
            time: [
                Math.floor(diffSeconds / 3600).toString().padStart(2, '0'),
                Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0'),
                (diffSeconds % 60).toString().padStart(2, '0')
            ],
            cost,
            isCountdown: false,
            startTime: sTime
        };
    }
};
