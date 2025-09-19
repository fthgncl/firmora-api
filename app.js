console.log("Start Firmora API");
const logError = require('./src/utils/logger');
const loadEnv = require('./src/utils/loadEnv');

(async () => {
    try {
        // Ortam değişkenlerini yükle
        const envResult = await loadEnv();
        console.log('Ortam değişkenleri yüklendi:', envResult.message);

        // loadEnv() tamamlandıktan sonra diğer modülleri yükle
        const colors = require('ansi-colors');

        console.log(colors.bgGreen.black('~~~ Uygulama başlatılıyor ~~~'));
        console.log(colors.bgYellow.black(envResult.message));

        console.log(colors.bgGreen.black('~~~ Uygulama başlatıldı! ~~~'));
    } catch (error) {
        await logError(error.message, error);
        console.error();
        console.log(colors.bgRed.black('~~~ Uygulama başlatılamadı! ~~~'));
        process.exit(1);
    }
})();