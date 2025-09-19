const cron = require('node-cron');
const mysqldump = require('mysqldump');
const path = require('path');
const fs = require('fs');
const colors = require('ansi-colors');
const logError = require('../utils/logger');

class BackupService {
    constructor() {
        this.backupPath = path.join(process.cwd(), 'backups');
        this.cronExpression = process.env.BACKUP_CRON_EXPRESSION || '0 3 * * *'; // Default: Her gece saat 03:00
        this.timezone = process.env.BACKUP_TIMEZONE || 'Europe/Istanbul'; // Default: Türkiye saati
        this.isRunning = false;
    }

    /**
     * Backup klasörünü oluştur
     */
    async ensureBackupDirectory() {
        if (!fs.existsSync(this.backupPath)) {
            fs.mkdirSync(this.backupPath, { recursive: true });
        }
    }

    /**
     * Veritabanı yedeğini al
     */
    async createBackup() {
        try {
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const filename = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
            const filePath = path.join(this.backupPath, filename);

            await mysqldump({
                connection: {
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    port: parseInt(process.env.DB_PORT) || 3306,
                },
                dumpToFile: filePath,
                compressFile: false
            });

            const stats = fs.statSync(filePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log(colors.bgGreen.white(`✓ Veritabanı yedekleme tamamlandı!`));
            console.log(colors.bgGreen.white(`  Dosya: ${filename}`));
            console.log(colors.bgGreen.white(`  Boyut: ${fileSizeInMB} MB`));
            console.log(colors.bgGreen.white(`  Konum: ${filePath}`));

            // Eski yedekleri temizle
            await this.cleanOldBackups();

        } catch (error) {
            throw new Error(`Veritabanı yedekleme hatası: ${error.message}`);
        }
    }

    /**
     * 30 günden eski yedekleri sil
     */
    async cleanOldBackups() {
        try {
            const files = fs.readdirSync(this.backupPath);
            const now = Date.now();
            const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS);
            const retentionTimeInMs = retentionDays * 24 * 60 * 60 * 1000;
            let deletedCount = 0;

            for (const file of files) {
                if (file.endsWith('.sql')) {
                    const filePath = path.join(this.backupPath, file);
                    const stats = fs.statSync(filePath);
                    const fileAge = now - stats.mtime.getTime();

                    if (fileAge > retentionTimeInMs) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        console.log(colors.dim(`Eski yedek silindi: ${file}`));
                    }
                }
            }

            if (deletedCount > 0) {
                console.log(colors.bgBlue.white(`${deletedCount} adet eski yedek dosyası temizlendi (${retentionDays} günden eskiler).`));
            }

        } catch (error) {
            throw new Error(`Eski yedekleri temizleme hatası: ${error.message}`);
        }
    }

    /**
     * Backup servisini başlat
     */
    async start() {
        try {
            if (this.isRunning) {
                return { status: 'success', message: 'Backup servisi zaten çalışıyor.' };
            }

            // Backup klasörünü oluştur
            await this.ensureBackupDirectory();

            // Cron job'u başlat
            cron.schedule(this.cronExpression, async () => {
                console.log(colors.bgMagenta.white('🔄 Zamanlanmış veritabanı yedekleme başlıyor...'));
                await this.createBackup();
            }, {
                timezone: this.timezone
            });

            this.isRunning = true;

            return {
                status: 'success',
                message: `Veritabanı yedekleme servisi başlatıldı. Zamanlanmış görev: '${this.cronExpression}' (${this.timezone} saati).`
            };

        } catch (error) {
            const errorMsg = `Backup servisi başlatma hatası: ${error.message}`;
            await logError(errorMsg, error);
            return { status: 'error', message: errorMsg };
        }
    }

    /**
     * Manuel yedekleme (test için)
     */
    async manualBackup() {
        await this.ensureBackupDirectory();
        await this.createBackup();
    }
}

const backupService = new BackupService();

const startBackupService = async () => {
    return await backupService.start();
};

const createManualBackup = async () => {
    return await backupService.manualBackup();
};

module.exports = {
    startBackupService,
    createManualBackup
};