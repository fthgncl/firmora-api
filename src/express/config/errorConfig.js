/**
 * Express uygulama hata işleyicilerini konfigüre eder
 * @param {Express} app - Express uygulama instance'ı
 */
const setupErrorHandlers = (app) => {
    // Genel hata yakalayıcı
    app.use((err, req, res) => {
        // Hata mesajını ve detaylarını ayarla
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // HTTP status kodunu belirle
        const statusCode = err.status || err.statusCode || 500;

        // Hata yanıtını gönder
        res.status(statusCode).json({
            hata: res.locals.message,
            ...(res.locals.error.stack && { stack: res.locals.error.stack })
        });
    });
};

module.exports = { setupErrorHandlers };