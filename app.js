const logError = require('./src/utils/logger');
const loadEnv = require('./src/utils/loadEnv');
const colors = require('ansi-colors');

(async () => {
    try {
        // Ortam değişkenlerini yükle
        const envResult = await loadEnv();
        console.log('Ortam değişkenleri yüklendi:', envResult.message);

        // loadEnv() tamamlandıktan sonra diğer modülleri yükle
        const colors = require('ansi-colors');
        const { databaseInit } = require('./src/database');

        console.log(colors.bgGreen.black('~~~ Uygulama başlatılıyor ~~~'));
        console.log(colors.bgYellow.black(envResult.message));

        // Veritabanını başlat
        const dbResult = await databaseInit();
        console.log(colors.bgYellow.black(dbResult.message));

        console.log(colors.bgGreen.black('~~~ Uygulama başlatıldı! ~~~'));
    } catch (error) {
        await logError(error.message, error);
        console.log(colors.bgRed.black('~~~ Uygulama başlatılamadı! ~~~'));
        process.exit(1);
    }
})();