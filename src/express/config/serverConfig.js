// src/express/config/serverConfig.js
const { t } = require('../../config/i18n.config');

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

    const bind =
        typeof port === 'string'
            ? `${t('server:pipe')} ${port}`
            : `${t('server:port')} ${port}`;

    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} ${t('server:errors.eacces')}`);
            throw error;
        case 'EADDRINUSE':
            console.error(`${bind} ${t('server:errors.eaddrinuse')}`);
            throw error;
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
