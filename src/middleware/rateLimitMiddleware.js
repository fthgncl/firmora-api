const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware konfigürasyonu
 * Aşırı istek trafiğini önlemek için kullanılır
 */
const createRateLimiter = () => {
    const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES);
    const windowMs = windowMinutes * 60 * 1000; // Dakikayı milisaniyeye çevir

    return rateLimit({
        windowMs: windowMs,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
        message: {
            error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
            retryAfter: `${windowMinutes} dakika`
        },
        standardHeaders: true, // Rate limit bilgilerini `RateLimit-*` header'larında döndür
        legacyHeaders: false, // `X-RateLimit-*` header'larını devre dışı bırak
        skipSuccessfulRequests: false, // Başarılı istekleri rate limit'e dahil etmeme özelliği (false=dahil et, true=dahil etme)
        skipFailedRequests: false,     // Başarısız istekleri rate limit'e dahil etmeme özelliği (false=dahil et, true=dahil etme)
        handler: (req, res, next) => {

            if (process.env.ENABLE_RATE_LIMIT === 'false' || process.env.ENABLE_RATE_LIMIT === undefined) {
                next();
                return;
            }

            res.status(429).json({
                error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.',
                retryAfter: `${windowMinutes} dakika`,
                timestamp: new Date().toISOString()
            });
        }
    });
};

/**
 * Strict rate limiter for sensitive endpoints (login, register, etc.)
 */
const createStrictRateLimiter = () => {
    const windowMinutes = parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MINUTES);
    const windowMs = windowMinutes * 60 * 1000; // Dakikayı milisaniyeye çevir
    const maxRequests = parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 5;
    return rateLimit({
        windowMs: windowMs,
        max: maxRequests,
        message: {
            error: 'Bu işlem için çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
            retryAfter: `${windowMinutes} dakika`
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false, // Başarılı istekleri rate limit'e dahil etmeme özelliği (false=dahil et, true=dahil etme)
        skipFailedRequests: false,     // Başarısız istekleri rate limit'e dahil etmeme özelliği (false=dahil et, true=dahil etme)
        handler: (req, res, next) => {

            if (process.env.ENABLE_RATE_LIMIT === 'false' || process.env.ENABLE_RATE_LIMIT === undefined) {
                next();
                return;
            }

            res.status(429).json({
                error: 'Bu işlem için çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
                retryAfter: `${windowMinutes} dakika`,
                timestamp: new Date().toISOString()
            });
        }
    });
};

module.exports = {
    generalRateLimit: createRateLimiter(),
    strictRateLimit: createStrictRateLimiter()
};