/**
 * @swagger
 * /password-reset/request:
 *   post:
 *     summary: Şifre sıfırlama bağlantısı talep et
 *     description: Kullanıcının e-posta adresine şifre sıfırlama bağlantısı gönderir
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Şifre sıfırlama bağlantısı gönderildi
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
 *                   example: Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
 *       400:
 *         description: Geçersiz istek - eksik parametre
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
 *                   example: E-posta adresi gereklidir.
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
 *                   example: Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.
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
 *                   example: Şifre sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyiniz.
 */

const { queryAsync } = require('../../../database/utils/connection');
const { sendPasswordResetEmail } = require('../../services/emailService');
const responseHelper = require('../../utils/responseHelper');
const {t} = require("../../../config/i18nConfig");

module.exports = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return responseHelper.error(res, t('emails.passwordReset.emailRequired'), 400);
    }

    try {
        const users = await queryAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);

        if (users.length === 0) {
            return responseHelper.error(res, t('emails.passwordReset.userNotFound'), 404);
        }

        const user = users[0];

        await sendPasswordResetEmail(user);

        return responseHelper.success(res, {
            message: t('emails.passwordReset.emailSent')
        });
    } catch (error) {
        return responseHelper.serverError(res, error);
    }
};
