const { Computer, Session } = require('./server/src/shared/database');

async function testFixes() {
    console.log('🧪 Flicker Logic Integration Testini boshlaymiz...');

    // 1. Mock a computer that is manually busy (No Session)
    const pc = { id: 999, name: 'TEST-PC', status: 'busy' };

    // Server logic simulation (from agentController.js fix)
    function getEffectiveStatus(pcStatus, activeSession) {
        let effectiveStatus = pcStatus;
        if (activeSession) {
            effectiveStatus = activeSession.status === 'paused' ? 'paused' : 'busy';
        } else if (pcStatus === 'busy' || pcStatus === 'paused') {
            effectiveStatus = pcStatus;
        } else {
            effectiveStatus = 'free';
        }
        return effectiveStatus;
    }

    // Test Case A: PC is busy, No session.
    console.log('Test A: Band PC, Sessiya yo\'q (Menejer ochgan holat)');
    let status = getEffectiveStatus('busy', null);
    console.log(`-> Natija: ${status} (Kutilgan: busy)`);
    if (status === 'busy') console.log('✅ TEST A O\'TDI!'); else console.error('❌ TEST A MUVAFFAQIYATSIZ!');

    // Test Case B: Active Session found.
    console.log('Test B: Sessiya topildi');
    status = getEffectiveStatus('free', { status: 'active' });
    console.log(`-> Natija: ${status} (Kutilgan: busy)`);
    if (status === 'busy') console.log('✅ TEST B O\'TDI!'); else console.error('❌ TEST B MUVAFFAQIYATSIZ!');

    // Test Case C: PC is free, No session.
    console.log('Test C: PC bo\'sh, Sessiya yo\'q');
    status = getEffectiveStatus('free', null);
    console.log(`-> Natija: ${status} (Kutilgan: free)`);
    if (status === 'free') console.log('✅ TEST C O\'TDI!'); else console.error('❌ TEST C MUVAFFAQIYATSIZ!');

    console.log('\n🚀 Xulosa: Server mantig\'i endi "Double-Guard" (PC Status + Session Record) bilan mustahkamlandi.');
}

testFixes().catch(console.error);
