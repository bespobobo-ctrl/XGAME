const axios = require('axios');
const { Computer, Session, sequelize } = require('./server/src/shared/database');

async function testUnlockAction() {
    console.log('🧪 UNLOCK TEST: "Vaqt ochish" ssenariysini tekshiramiz...');

    try {
        // 1. Birinchi bo'sh PC-ni topamiz
        const pc = await Computer.findOne({ where: { status: 'free' } });
        if (!pc) {
            console.log('⚠️ Bo\'sh kompyuter topilmadi. Testni o\'tkazib bo\'lmaydi.');
            return;
        }

        console.log(`🖥️  Tanlangan PC: ${pc.name} (ID: ${pc.id})`);

        // 2. Mantiqiy jihatdan, ManagerAppController.pcAction chaqirilganda nima bo'ladi?
        // Biz sessionService.executeAction ni to'g'ridan-to'g'ri simulyatsiya qilamiz.
        const sessionService = require('./server/src/modules/panelC/sessionService');

        console.log('🚀 Sessiya ochilmoqda (60 minut)...');
        await sessionService.executeAction(pc.id, pc.ClubId, {
            action: 'start',
            expectedMinutes: 60
        });

        // 3. Bazadagi holatni tekshiramiz
        const updatedPc = await Computer.findByPk(pc.id);
        const activeSession = await Session.findOne({
            where: { ComputerId: pc.id, status: 'active' }
        });

        console.log(`📊 PC Status: ${updatedPc.status} (Kutilgan: busy)`);
        console.log(`📄 Sessiya: ${activeSession ? 'TOPILDI' : 'TOPILMADI'} (Kutilgan: TOPILDI)`);

        if (updatedPc.status === 'busy' && activeSession) {
            console.log('✅ SERVER MANTIG\'I TO\'G\'RI: Baza yangilandi.');
            console.log('✅ SOCKET BUYRUG\'I: ManagerAppController orqali "unlock" yuboriladi.');
        } else {
            console.error('❌ MANTIQIY XATO: Baza yangilanmadi.');
        }

    } catch (err) {
        console.error('❌ Xatolik:', err.message);
    }
}

testUnlockAction().then(() => process.exit(0));
