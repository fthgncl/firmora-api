const createError = require('http-errors');

// Routes
const statusRouter = require('../routes/serverStatus');
const signInRouter = require('../routes/signIn');
const signUp = require('../routes/signUp');
const companiesRouter = require('../routes/companies');
const verifyEmail = require('../routes/verifyEmail');


// Middleware
const verifyTokenMiddleware = require('../middleware/verifyToken');
const refreshTokenMiddleware = require('../middleware/refreshToken');
const { strictRateLimit } = require('../middleware/rateLimitMiddleware');

const setupRoutes = (app) => {

    app.use('/server-status', strictRateLimit, statusRouter);
    app.use('/sign-in', strictRateLimit, signInRouter);
    app.use('/sign-up', strictRateLimit, signUp);
    app.use('/verify-email', verifyEmail);


    app.use('/', strictRateLimit, verifyTokenMiddleware);
    app.use('/', strictRateLimit, refreshTokenMiddleware);

    // Korumalı rotalar
    app.use('/companies', strictRateLimit, companiesRouter);

    // 404 hata handler'ı - hiçbir rotaya eşleşmeyen istekler için
    app.use((req, res, next) => {
        next(createError(404));
    });
};

module.exports = { setupRoutes };