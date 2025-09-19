const http = require('http');
const { handleServerError } = require('../config/serverConfig');

/**
 * HTTP sunucusunu başlatır
 * @param {Express} app - Express uygulama instance'ı
 * @param {string|number} port - Port değeri
 * @returns {Promise} Sunucu başlatma sonucunu döndürür
 */
const startServer = (app, port) => {
    return new Promise((resolve, reject) => {
        const server = http.createServer(app);

        server.listen(port)
            .on('listening', () => {
                resolve({
                    status: 'success',
                    message: `Express sunucusu ${port} portunda çalışıyor.`,
                    server
                });
            })
            .on('error', (error) => {
                handleServerError(error, port);
                reject({
                    status: 'error',
                    message: `Express sunucusu başlatılırken hata oluştu: ${error.message}`,
                });
            });
    });
};

module.exports = { startServer };