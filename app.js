const logError = require('./src/utils/logger');
const loadEnv = require('./src/utils/loadEnv');
const colors = require('ansi-colors');
const {databaseInit} = require("./src/database");

(async () => {
    try {
        // Ortam değişkenlerini yükle
        const envResult = await loadEnv();

        // i18next'i başlat
        const { initializeI18n, t } = require('./src/config/i18nConfig');
        const i18nResult = await initializeI18n();

        console.log(colors.bgGreen.black(`~~~ ${t('server.starting')} ~~~`));
        console.log(colors.bgYellow.black(envResult.message));
        console.log(colors.bgYellow.black(i18nResult.message));

        // loadEnv() tamamlandıktan sonra diğer modülleri yükle
        const { databaseInit } = require('./src/database');
        const startExpressApp = require('./src/express');
        const { startBackupService } = require('./src/services/backupService');

        // Veritabanını başlat
        const dbResult = await databaseInit();
        console.log(colors.bgYellow.black(dbResult.message));

        // Express uygulamasını başlat
        const appResult = await startExpressApp();
        console.log(colors.bgYellow.black(appResult.message));

        // Backup servisini başlat
        const backupResult = await startBackupService();
        console.log(colors.bgYellow.black(backupResult.message));

        console.log(colors.bgGreen.black(`~~~ ${t('server.started')} ~~~`));
    } catch (error) {
        await logError(error.message, error);
        console.log(colors.bgRed.black(`~~~ ${t('server.failed')} ~~~`));
        process.exit(1);
    }
})();