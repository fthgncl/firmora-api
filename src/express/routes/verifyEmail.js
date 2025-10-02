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

router.post('/send', async (req, res) => {
    const { emailOrUsername } = req.body;

    if (!emailOrUsername) {
        return responseHelper.error(res, 'E-posta adresi veya kullanıcı adı (key:emailOrUsername) boş olamaz.', 400);
    }

    let normalizedEmail;
    let isEmail = validator.email(emailOrUsername);

    if (isEmail) {
        normalizedEmail = emailOrUsername.trim().toLowerCase();
    } else {
        // Kullanıcı adı verilmiş, veritabanından email adresini bulmalıyız
        try {
            const user = await queryAsync('SELECT email FROM Users WHERE username = ?', [emailOrUsername]);
            if (!user.length) {
                return responseHelper.error(res, 'Bu kullanıcı adına ait bir hesap bulunamadı.', 404);
            }
            normalizedEmail = user[0].email;
        } catch (error) {
            return responseHelper.serverError(res, error);
        }
    }

    try {
        const user = await queryAsync('SELECT emailverified, name, surname, username, email, created_at FROM Users WHERE email = ?', [normalizedEmail]);

        if (!user.length) {
            return responseHelper.error(res, 'Bu e-posta adresine ait bir hesap bulunamadı.', 404);
        }

        if (user[0].emailverified) {
            return responseHelper.error(res, 'Bu e-posta adresi zaten doğrulanmış.', 400);
        }

        // Doğrulama e-postası gönder
        await sendVerificationEmail(user[0]);

        return responseHelper.success(res, {
            message: 'Doğrulama e-postası başarıyla gönderildi.'
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

router.get('/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Token'ı doğrula
        const decoded = await verifyToken(token);

        if (!decoded || !decoded.email) {
            return responseHelper.error(res, 'Geçersiz veya süresi dolmuş token.', 400);
        }

        // Kullanıcıyı veritabanında ara
        const user = await queryAsync('SELECT * FROM Users WHERE email = ?', [decoded.email]);

        if (!user.length) {
            return responseHelper.error(res, 'Kullanıcı bulunamadı.', 404);
        }

        // Kullanıcı zaten doğrulanmış mı kontrol et
        if (user[0].emailverified) {
            return responseHelper.success(res, {
                message: 'E-posta adresi zaten doğrulanmış.'
            });
        }

        // Kullanıcının e-posta adresini doğrulanmış olarak işaretle
        await queryAsync('UPDATE Users SET emailverified = true WHERE email = ?', [decoded.email]);

        return responseHelper.success(res, {
            message: 'E-posta başarıyla doğrulandı.'
        });
    } catch (error) {
        return responseHelper.error(res, 'E-posta doğrulanamadı. Geçersiz veya süresi dolmuş token.', 400);
    }
});

module.exports = router;
