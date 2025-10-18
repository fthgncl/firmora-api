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
    app.use('/transfers', strictRateLimit, transfersRouter);
    app.use('/accounts', strictRateLimit, accountsRouter);
    app.use('/search-users', strictRateLimit, searchUsersRouter);
    app.use('/permissions', strictRateLimit, getPermissionsRouter);
    app.use('/update-permissions', strictRateLimit, updatePermissionsRouter);

    // 404 hata handler'ı - hiçbir rotaya eşleşmeyen istekler için
    app.use((req, res, next) => {
        next(createError(404));
    });
};

module.exports = { setupRoutes };