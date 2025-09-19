const {createToken} = require('../../auth/jwt');

/**
 * @swagger
 * components:
 *   headers:
 *     NewToken:
 *       description: Yenilenen JWT token
 *       schema:
 *         type: string
 *       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFobWV0IiwiaWF0IjoxNjg1MzM4NzM5LCJleHBpcmVkIjoiY29tcGxldGVsaW5lIn0.9nob-sCdFnjRi2tnbOQtwOnFAF1Y-2-LAKLtmq-PRlM
 *   responses:
 *     TokenRefreshed:
 *       description: Token yenilendi, yeni token 'x-new-token' başlığında döndürülür.
 *       headers:
 *         x-new-token:
 *           schema:
 *             type: string
 *           description: Yeni oluşturulan JWT token
 */

// JWT token yenileme middleware
async function refreshTokenMiddleware(req, res, next) {
    const newToken = await createToken(req.tokenPayload, req.tokenPayload.rememberMe ? process.env.REMEMBER_ME_TOKEN_LIFETIME : process.env.TOKEN_LIFETIME);
    res.setHeader('x-new-token', newToken);
    next();
}

module.exports = refreshTokenMiddleware;