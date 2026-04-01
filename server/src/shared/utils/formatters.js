const formatUZS = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0
    }).format(Math.round(amount || 0));
};

const formatTimeTashkent = (date, includeSeconds = false) => {
    if (!date) return '--:--';
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined,
        timeZone: 'Asia/Tashkent',
        hour12: false
    }).format(new Date(date));
};

module.exports = {
    formatUZS,
    formatTimeTashkent
};
