// src/services/backupService.js
const cron = require('node-cron');
const logError = require('../utils/logger');
const { startDatabaseBackupService } = require('./databaseBackupService');
const { syncGoogleDriveBackupFolders } = require('./googleDriveService');

const startBackupService = async () => {
    try {
        // 1) Feature flag kontrolü
        if (process.env.BACKUP_ENABLED !== 'true') {
            return {
                status: 'success',
                message: 'Backup servisi bu ortam için devre dışı (BACKUP_ENABLED=false).',
            };
        }

        const cronExpression = process.env.BACKUP_CRON_EXPRESSION || '0 3 * * *';
        const timezone = process.env.BACKUP_TIMEZONE || 'Europe/Istanbul';

        // 2) Cron ifadesi geçerli mi?
        const isValid = cron.validate(cronExpression);
        if (!isValid) {
            const error = new Error(`Geçersiz cron ifadesi: ${cronExpression}`);
            const errorMsg = `Backup cron yapılandırma hatası: ${error.message}`;
            await logError(errorMsg, error);
            return { status: 'error', error, message: errorMsg };
        }

        // 3) Cron job'u kaydet
        cron.schedule(
            cronExpression,
            async () => {
                console.log('[BackupService] Yedekleme işlemi başlatıldı...');

                // 1) Veritabanı yedeği
                const dbResult = await startDatabaseBackupService();
                if (dbResult && dbResult.status === 'error') {
                    await logError(dbResult.message, dbResult.error);
                }

                // 2) Google Drive klasör senkronizasyonu
                const driveResult = await syncGoogleDriveBackupFolders();
                if (driveResult && driveResult.status === 'error') {
                    await logError(driveResult.message, driveResult.error);
                }

                console.log('[BackupService] Yedekleme işlemi tamamlandı.');
            },
            {
                timezone,
                scheduled: true
            }
        );

        console.log(
            `[BackupService] Cron job kaydedildi: '${cronExpression}' (${timezone}).`
        );

        return {
            status: 'success',
            message: `Backup cron servisi başlatıldı. Cron: '${cronExpression}' (${timezone}).`,
        };

    } catch (error) {
        const errorMsg = `Backup servisi başlatma hatası: ${error.message}`;
        await logError(errorMsg, error);
        return { status: 'error', error, message: errorMsg };
    }
};

module.exports = { startBackupService };
