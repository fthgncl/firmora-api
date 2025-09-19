/**
 * Port değerini normalize eder
 * @param {string|number} val - Port değeri
 * @returns {string|number|boolean} Normalize edilmiş port değeri
 */
const normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val; // İsimlendirilmiş boru (pipe)
    if (port >= 0) return port; // Port numarası
    return false;
};

/**
 * Sunucu hatalarını işler
 * @param {Error} error - Hata objesi
 * @param {string|number} port - Port değeri
 */
const handleServerError = (error, port) => {
    if (error.syscall !== 'listen') throw error;

    const bind = typeof port === 'string' ? `Boru ${port}` : `Port ${port}`;

    // Özel hataları ele al
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} için yetkili erişim gerekli.`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} zaten kullanılıyor.`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

/**
 * Port konfigürasyonunu ayarlar
 * @param {Express} app - Express uygulama instance'ı
 * @returns {string|number} Port değeri
 */
const setupPort = (app) => {
    const port = normalizePort(process.env.EXPRESS_PORT || '3000');
    app.set('port', port);
    return port;
};

module.exports = {
    normalizePort,
    handleServerError,
    setupPort
};