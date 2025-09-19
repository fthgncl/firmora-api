const createError = require('http-errors');

// Routes
const statusRouter = require('../routes/serverStatus');


// Middleware
const verifyTokenMiddleware = require('../middleware/verifyToken');
const refreshTokenMiddleware = require('../middleware/refreshToken');
const tokenPayloadMiddleware = require('../middleware/tokenPayloadMiddleware');
const { strictRateLimit } = require('../../middleware/rateLimitMiddleware');

const setupRoutes = (app) => {

    // Tüm routerlardan önce tokenPayload middleware'ini uygula (token kontrolü zorunlu değil)
    app.use(tokenPayloadMiddleware);

    app.use('/server-status', statusRouter);


    app.use('/', verifyTokenMiddleware);
    app.use('/', refreshTokenMiddleware);

    // Korumalı rotalar
    // app.use......

    // 404 hata handler'ı - hiçbir rotaya eşleşmeyen istekler için
    app.use((req, res, next) => {
        next(createError(404));
    });
};

module.exports = { setupRoutes };