const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { handleServerError } = require('../config/serverConfig');

/**
 * HTTP veya HTTPS sunucusunu başlatır
 * @param {Express} app - Express uygulama instance'ı
 * @param {string|number} port - Port değeri
 * @returns {Promise} Sunucu başlatma sonucunu döndürür
 */
const startServer = (app, port) => {
    return new Promise((resolve, reject) => {
        let server;
        const useSSL = process.env.USE_SSL === 'true';

        if (useSSL) {
            try {
                // SSL sertifika dosyalarının yolu (production'da bu dosyaların bulunması gerekir)
                const sslPath = path.join(process.cwd(), 'ssl');
                const privateKey = fs.readFileSync(path.join(sslPath, 'private.key'), 'utf8');
                const certificate = fs.readFileSync(path.join(sslPath, 'certificate.crt'), 'utf8');
                const ca = fs.existsSync(path.join(sslPath, 'ca_bundle.crt'))
                    ? fs.readFileSync(path.join(sslPath, 'ca_bundle.crt'), 'utf8')
                    : undefined;

                const credentials = {
                    key: privateKey,
                    cert: certificate,
                    ...(ca && { ca })
                };

                server = https.createServer(credentials, app);
            } catch (error) {
                return reject({
                    status: 'error',
                    message: `SSL sertifikaları yüklenirken hata oluştu: ${error.message}`,
                });
            }
        } else {
            server = http.createServer(app);
        }

        server.listen(port)
            .on('listening', () => {
                const protocol = useSSL ? 'HTTPS' : 'HTTP';
                resolve({
                    status: 'success',
                    message: `Express sunucusu ${protocol} ile ${port} portunda çalışıyor.`,
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