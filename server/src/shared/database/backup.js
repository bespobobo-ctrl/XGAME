const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 💾 GAMEZONE DB BACKUP SYSTEM
 * Har kuni bazaning nusxasini backups/ papkasiga saqlaydi.
 */
function runBackup() {
    try {
        const dbPath = path.resolve(__dirname, '../../../../data/gamezone_v2.db');
        const backupDir = path.resolve(__dirname, '../../../../backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        if (!fs.existsSync(dbPath)) {
            logger.warn('💾 Backup: Baza fayli topilmadi, nusxalash bekor qilindi.');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `gamezone_backup_${timestamp}.db`);

        fs.copyFileSync(dbPath, backupFile);
        logger.info(`✅ Backup muvaffaqiyatli yaratildi: ${backupFile}`);

        // 🧹 ESKI BACKUP-LARNI TOZALASH (Oxirgi 7 ta qoladi)
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('gamezone_backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 7) {
            files.slice(7).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f.name));
                logger.info(`🧹 Eski backup o'chirildi: ${f.name}`);
            });
        }
    } catch (error) {
        logger.error('❌ Backup Error:', error);
    }
}

// Har 12 soatda bir marta backup qilish
setInterval(runBackup, 12 * 60 * 60 * 1000);

// Server yoqilganida darhol birinchi backup-ni qilish
runBackup();

module.exports = { runBackup };
