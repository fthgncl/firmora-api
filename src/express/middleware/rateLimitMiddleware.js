// src/express/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const { t } = require('../../config/i18n.config');

/**
 * Genel rate limiter
 * Aşırı istek trafiğini önlemek için kullanılır
 */
const createRateLimiter = () => {
    const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES);
    const windowMs = windowMinutes * 60 * 1000;

    return rateLimit({
        windowMs,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
        message: {
            error: t('errors:rateLimit.tooManyRequests'),
            retryAfter: t('errors:rateLimit.retryAfter', { minutes: windowMinutes })
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        handler: (req, res, next) => {
            if (process.env.ENABLE_RATE_LIMIT === 'false' || process.env.ENABLE_RATE_LIMIT === undefined) {
                next();
                return;
            }

            res.status(429).json({
                error: t('errors:rateLimit.tooManyRequests'),
                retryAfter: t('errors:rateLimit.retryAfter', { minutes: windowMinutes }),
                timestamp: new Date().toISOString()
            });
        }
    });
};

/**
 * Hassas endpointler için (login/register vb.) daha sıkı rate limiter
 */
const createStrictRateLimiter = () => {
    const windowMinutes = parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MINUTES);
    const windowMs = windowMinutes * 60 * 1000;
    const maxRequests = parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 5;

    return rateLimit({
        windowMs,
        max: maxRequests,
        message: {
            error: t('errors:rateLimit.tooManyAttempts'),
            retryAfter: t('errors:rateLimit.retryAfter', { minutes: windowMinutes })
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        handler: (req, res, next) => {
            if (process.env.ENABLE_RATE_LIMIT === 'false' || process.env.ENABLE_RATE_LIMIT === undefined) {
                next();
                return;
            }

            res.status(429).json({
                error: t('errors:rateLimit.tooManyAttempts'),
                retryAfter: t('errors:rateLimit.retryAfter', { minutes: windowMinutes }),
                timestamp: new Date().toISOString()
            });
        }
    });
};

module.exports = {
    generalRateLimit: createRateLimiter(),
    strictRateLimit: createStrictRateLimiter()
};
