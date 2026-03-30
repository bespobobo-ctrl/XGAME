const { User, Club, Room, Computer } = require('./server/src/database');
const path = require('path');

async function check() {
    try {
        const clubs = await Club.findAll();
        console.log("CLUBS:", JSON.stringify(clubs.map(c => ({ id: c.id, name: c.name })), null, 2));

        const users = await User.findAll({ where: { role: 'customer' } });
        console.log("CUSTOMERS (first 5):", JSON.stringify(users.slice(0, 5).map(u => ({ id: u.id, username: u.username, ClubId: u.ClubId, telegramId: u.telegramId })), null, 2));

        const rooms = await Room.findAll();
        console.log("ROOMS:", JSON.stringify(rooms.map(r => ({ id: r.id, name: r.name, ClubId: r.ClubId })), null, 2));

        const pcs = await Computer.findAll();
        console.log("PCS COUNT:", pcs.length);
        console.log("PCS SAMPLE:", JSON.stringify(pcs.slice(0, 3).map(p => ({ id: p.id, name: p.name, ClubId: p.ClubId, RoomId: p.RoomId })), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
