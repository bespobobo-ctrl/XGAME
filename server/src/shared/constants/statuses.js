const SESSION_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FORCED_STOP: 'forced_stop',
    RESERVED: 'reserved'
};

const PC_STATUS = {
    FREE: 'free',
    BUSY: 'busy',
    PAUSED: 'paused',
    RESERVED: 'reserved',
    MAINTENANCE: 'maintenance'
};

const ROLES = {
    SUPER_ADMIN: 'superadmin',
    MANAGER: 'manager',
    PLAYER: 'player'
};

module.exports = {
    SESSION_STATUS,
    PC_STATUS,
    ROLES
};
