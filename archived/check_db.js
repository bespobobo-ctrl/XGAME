const { User, Club, Computer } = require('./server/src/database/index');

async function check() {
    try {
        const usersCount = await User.count();
        const clubsCount = await Club.count();
        const pcsCount = await Computer.count();

        console.log(`\n📊 DATABASE STATUS:`);
        console.log(`- Users: ${usersCount}`);
        console.log(`- Clubs: ${clubsCount}`);
        console.log(`- Computers: ${pcsCount}`);

        if (usersCount > 0) {
            const users = await User.findAll({ limit: 5 });
            console.log(`\n👥 Recent Users:`, users.map(u => u.username));
        }

    } catch (e) {
        console.error("❌ FAIL:", e);
    } finally {
        process.exit();
    }
}

check();
