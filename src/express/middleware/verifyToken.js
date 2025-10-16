const { verifyToken } = require('../../auth/jwt');
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18nConfig');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-access-token
 *       description: API key authentication
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Token sağlanmadı veya geçersiz token.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Token doğrulama başarısız.
 */

/**
 * JWT token doğrulama middleware
 */
async function verifyTokenMiddleware(req, res, next) {
    const token = req.headers['x-access-token'] || req.body?.token || req.query?.token;

    if (!token) {
        return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
    }

    try {
        req.tokenPayload = await verifyToken(token);
        next();
    } catch (error) {
        return responseHelper.error(res, t('errors:auth.tokenInvalid'), 401);
    }
}

module.exports = verifyTokenMiddleware;