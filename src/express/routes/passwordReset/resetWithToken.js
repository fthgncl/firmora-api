/**
 * @swagger
 * /password-reset/token/{token}:
 *   post:
 *     summary: Şifre sıfırlama işlemi
 *     description: Verilen token ile kullanıcının şifresini sıfırlar
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Şifre sıfırlama token'ı
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: Yeni şifre (8-20 karakter, büyük/küçük harf, rakam ve özel karakter içermeli)
 *     responses:
 *       200:
 *         description: Şifre başarıyla sıfırlandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Şifreniz başarıyla güncellendi.
 *       400:
 *         description: Geçersiz veya süresi dolmuş token veya geçersiz şifre formatı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Şifre 8 ile 20 karakter uzunluğunda olmalı, büyük harf, küçük harf, rakam ve özel karakter içermelidir.
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Kullanıcı bulunamadı.
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Şifre sıfırlama sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.
 */

const validator = require('../../../utils/validation');
const { queryAsync } = require('../../../database/utils/connection');
const { verifyToken } = require('../../../auth/jwt');
const bcrypt = require('bcryptjs');
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18nConfig");

module.exports = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
        return responseHelper.error(res, t('emails:passwordReset.tokenAndPasswordRequired'), 400);
    }

    if (!validator.password(newPassword)) {
        return responseHelper.error(res, t('emails:passwordReset.invalidPasswordFormat'), 400);
    }

    try {
        let decoded;
        try {
            // Token doğrulama
            decoded = await verifyToken(token);

            if (!decoded) {
                return responseHelper.error(res, t('emails:passwordReset.tokenVerificationFailed'), 400);
            }

            if (!decoded.id || !decoded.email) {
                return responseHelper.error(res, t('emails:passwordReset.invalidTokenData'), 400);
            }
        } catch (tokenError) {
            // JWT hata detaylarını kontrol et
            if (tokenError.name === 'TokenExpiredError') {
                return responseHelper.error(res, t('emails:passwordReset.tokenExpired'), 401);
            } else if (tokenError.name === 'JsonWebTokenError') {
                return responseHelper.error(res, t('emails:passwordReset.invalidTokenFormat'), 401);
            } else {
                return responseHelper.error(res, t('emails:passwordReset.tokenVerificationError', { error: tokenError.message }), 401);
            }
        }

        // Kullanıcıyı doğrula
        const users = await queryAsync('SELECT * FROM users WHERE id = ? AND email = ?', [decoded.id, decoded.email]);

        if (users.length === 0) {
            return responseHelper.error(res, t('emails:passwordReset.userNotFound'), 404);
        }

        // Yeni şifreyi hashle ve veritabanında güncelle
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await queryAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

        return responseHelper.success(res, {
            message: t('emails:passwordReset.passwordUpdated')
        });
    } catch (error) {
        return responseHelper.serverError(res, error);
    }
};
