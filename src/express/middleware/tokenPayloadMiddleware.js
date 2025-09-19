const { verifyToken } = require('../../auth/jwt');

/**
 * @swagger
 * components:
 *   description: Bu middleware tüm rotalar için geçerlidir ve token varsa tokenPayload'ı oluşturur, yoksa boş geçer.
 */

// TokenPayload middleware - token varsa tokenPayload'ı ayarlar, yoksa null olarak bırakır
async function tokenPayloadMiddleware(req, res, next) {
    try {
        req.tokenPayload = null;

        const token = req.headers['x-access-token'] || req.body.token || req.query.token;

        if (token) {
            try {
                req.tokenPayload = await verifyToken(token);
            } catch (error) {
                // Token geçersiz olsa bile hata döndürme, sadece tokenPayload'ı null olarak bırak
                req.tokenPayload = null;
            }
        }
        next();
    } catch (error) {
        // Beklenmeyen hatalar için de tokenPayload'ı null yap ve devam et
        req.tokenPayload = null;
        next();
    }
}

module.exports = tokenPayloadMiddleware;