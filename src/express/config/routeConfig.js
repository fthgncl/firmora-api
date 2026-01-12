const createError = require('http-errors');

// Routes
const statusRouter = require('../routes/serverStatus');
const signInRouter = require('../routes/signIn');
const signUp = require('../routes/signUp');
const companiesRouter = require('../routes/companies');
const transfersRouter = require('../routes/transfers');
const accountsRouter = require('../routes/accounts');
const verifyEmail = require('../routes/verifyEmail');
const searchUsersRouter = require('../routes/searchUsers');
const getPermissionsRouter = require('../routes/getPermissions');
const updatePermissionsRouter = require('../routes/updatePermissions');
const passwordResetRouter = require('../routes/passwordReset');
const turnstileRouter = require('../routes/turnstile');
const oauthKeysRouter = require('../routes/oauthKeys');
const workStatusRouter = require('../routes/workStatus');
const userAllowedDaysRouter = require('../routes/AllowedDays');



// Middleware
const verifyTokenMiddleware = require('../middleware/verifyToken');
const refreshTokenMiddleware = require('../middleware/refreshToken');
const { strictRateLimit } = require('../middleware/rateLimitMiddleware');

const setupRoutes = (app) => {

    // Token middleware'lerinin çalışmayacağı özel rotalar
    const excludedRoutes = [
        '/turnstile/get-token',
        '/oauth-keys/google/callback',
        '/oauth-keys/google/auth'
    ];


    // Rotanın exclude listesinde olup olmadığını kontrol eden fonksiyon
    const isRouteExcluded = (path) => {
        return excludedRoutes.some(route => path.startsWith(route));
    };

    app.use('/server-status', strictRateLimit, statusRouter);
    app.use('/sign-in', strictRateLimit, signInRouter);
    app.use('/sign-up', strictRateLimit, signUp);
    app.use('/verify-email', verifyEmail);
    app.use('/password-reset', strictRateLimit, passwordResetRouter);
    app.use('/oauth-keys', strictRateLimit, oauthKeysRouter);


    // Token middleware'lerini sadece excludedRoutes dışındaki rotalarda çalıştır
    app.use('/', strictRateLimit, (req, res, next) => {
        if (isRouteExcluded(req.path)) {
            return next();
        }
        verifyTokenMiddleware(req, res, next);
    });

    app.use('/', strictRateLimit, (req, res, next) => {
        if (isRouteExcluded(req.path)) {
            return next();
        }
        refreshTokenMiddleware(req, res, next);
    });

    // Korumalı rotalar
    app.use('/companies', strictRateLimit, companiesRouter);
    app.use('/transfers', strictRateLimit, transfersRouter);
    app.use('/accounts', strictRateLimit, accountsRouter);
    app.use('/search-users', strictRateLimit, searchUsersRouter);
    app.use('/permissions', strictRateLimit, getPermissionsRouter);
    app.use('/update-permissions', strictRateLimit, updatePermissionsRouter);
    app.use('/turnstile', strictRateLimit, turnstileRouter);
    app.use('/work-status', strictRateLimit, workStatusRouter);
    app.use('/user-allowed-days', strictRateLimit, userAllowedDaysRouter);

    // 404 hata handler'ı - hiçbir rotaya eşleşmeyen istekler için
    app.use((req, res, next) => {
        next(createError(404));
    });
};

module.exports = { setupRoutes };