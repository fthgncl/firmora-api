/**
 * @swagger
 * /verify-email/send:
 *   post:
 *     summary: E-posta doğrulama bağlantısı gönder
 *     description: Kullanıcının e-posta adresine veya kullanıcı adına doğrulama e-postası gönderir.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 description: Kullanıcının e-posta adresi veya kullanıcı adı
 *                 example: "ahmet@example.com"
 *     responses:
 *       200:
 *         description: Doğrulama e-postası başarıyla gönderildi
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
 *                   example: Doğrulama e-postası başarıyla gönderildi.
 *       400:
 *         description: Geçersiz istek - eksik parametre veya zaten doğrulanmış e-posta
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
 *                   example: E-posta adresi veya kullanıcı adı (key:emailOrUsername) boş olamaz.
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
 *                   example: Bu e-posta adresine ait bir hesap bulunamadı.
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
 *                   example: Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyiniz.
 */

/**
 * @swagger
 * /verify-email/{token}:
 *   get:
 *     summary: E-posta doğrulama işlemi
 *     description: Verilen token ile kullanıcının e-posta adresini doğrular.
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Doğrulama token'ı
 *     responses:
 *       200:
 *         description: E-posta başarıyla doğrulandı veya zaten doğrulanmış
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
 *                   example: E-posta başarıyla doğrulandı.
 *       400:
 *         description: Geçersiz veya süresi dolmuş token
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
 *                   example: E-posta doğrulanamadı. Geçersiz veya süresi dolmuş token.
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
 */

const express = require('express');
const router = express.Router();
const validator = require("../../utils/validation");
const { queryAsync } = require("../../database/utils/connection");
const { sendVerificationEmail } = require("../services/emailService");
const { verifyToken } = require('../../auth/jwt');
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18n.config');

router.post('/send', async (req, res) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        return responseHelper.error(res, t('errors:verifyEmail.emailOrUsernameRequired'), 400);
    }

    let normalizedEmail;
    const isEmail = validator.email(emailOrUsername);

    if (isEmail) {
        normalizedEmail = emailOrUsername.trim().toLowerCase();
    } else {
        try {
            const user = await queryAsync('SELECT email FROM Users WHERE username = ?', [emailOrUsername]);
            if (!user.length) {
                return responseHelper.error(res, t('errors:verifyEmail.usernameNotFound'), 404);
            }
            normalizedEmail = user[0].email;
        } catch (error) {
            return responseHelper.serverError(res, error);
        }
    }

    try {
        const user = await queryAsync(
            'SELECT emailverified, name, surname, username, email, created_at FROM Users WHERE email = ?',
            [normalizedEmail]
        );

        if (!user.length) {
            return responseHelper.error(res, t('errors:verifyEmail.accountNotFoundByEmail'), 404);
        }

        if (user[0].emailverified) {
            return responseHelper.error(res, t('errors:verifyEmail.alreadyVerified'), 400);
        }

        await sendVerificationEmail(user[0]);

        return responseHelper.success(res, {
            message: t('emails:verify.emailSent')
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

router.get('/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = await verifyToken(token);

        if (!decoded || !decoded.email) {
            return responseHelper.error(res, t('errors:verifyEmail.invalidOrExpiredToken'), 400);
        }

        const user = await queryAsync('SELECT * FROM Users WHERE email = ?', [decoded.email]);

        if (!user.length) {
            return responseHelper.error(res, t('errors:verifyEmail.userNotFound'), 404);
        }

        if (user[0].emailverified) {
            return responseHelper.success(res, {
                message: t('emails:verify.alreadyVerified')
            });
        }

        await queryAsync('UPDATE Users SET emailverified = true WHERE email = ?', [decoded.email]);

        return responseHelper.success(res, {
            message: t('emails:verify.verifiedSuccess')
        });
    } catch (error) {
        return responseHelper.error(res, t('errors:verifyEmail.invalidOrExpiredToken'), 400);
    }
});

module.exports = router;
