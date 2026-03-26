const { User, sequelize } = require('./server/src/database/index');

async function checkDetailedError() {
    try {
        console.log("Ulayapman...");
        await sequelize.authenticate();
        console.log("Ulandi.");

        await User.findOne({ where: { telegramId: "7201729792" } });
        console.log("Muvaffaqiyat!");
    } catch (e) {
        console.error("Xatolik:");
        console.error("Message:", e.message);
        console.error("Name:", e.name);
        if (e.original) {
            console.error("Original SQL Error:", e.original.message);
        }
    } finally {
        process.exit();
    }
}

checkDetailedError();
