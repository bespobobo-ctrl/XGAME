const { Room, Computer, Club } = require('./server/src/shared/database');
const { initializeDatabase } = require('./server/src/shared/database/index');

async function test() {
    await initializeDatabase();
    try {
        const club = await Club.create({ name: 'Test Club', ownerId: 1 });
        const room = await Room.create({ name: 'Test Room', pricePerHour: 50, ClubId: club.id });
        await Computer.create({ name: 'PC1', RoomId: room.id, ClubId: club.id });
        await Computer.create({ name: 'PC2', RoomId: room.id, ClubId: club.id });
        console.log('Success');
    } catch (e) {
        console.log('ERROR:', e.name, e.message);
        console.log('ERRORS:', e.errors ? e.errors.map(err => err.message) : 'none');
    }
}
test();
