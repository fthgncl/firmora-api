const express = require("express");
const router = express.Router();
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18n.config");
const {verifyToken} = require("../../../auth/jwt");
const {createEntry} = require("../../../database/userCompanyEntries");

/**
 * @swagger
 * /turnstile/scan:
 *   post:
 *     tags:
 *       - Turnstile
 *     summary: QR kod okutarak giriş/çıkış kaydı oluştur
 *     description: Kullanıcı QR kod okutarak firmaya giriş veya çıkış kaydını oluşturur. QR koddan alınan turnstile token ile firma bilgisi doğrulanır.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turnstileToken
 *               - entryType
 *             properties:
 *               turnstileToken:
 *                 type: string
 *                 description: QR kod içerisinden okunan turnstile token'ı
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               entryType:
 *                 type: string
 *                 enum: [entry, exit]
 *                 description: Giriş mi çıkış mı (entry = giriş, exit = çıkış)
 *                 example: "entry"
 *               note:
 *                 type: string
 *                 maxLength: 255
 *                 description: Opsiyonel not
 *                 example: "Normal giriş"
 *     responses:
 *       200:
 *         description: Giriş/çıkış kaydı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Giriş kaydı başarıyla oluşturuldu"
 *       400:
 *         description: Geçersiz istek (token veya entryType eksik/hatalı, kullanıcı firmaya ait değil)
 *       401:
 *         description: Kullanıcı token'ı eksik veya geçersiz
 *       500:
 *         description: Sunucu hatası
 */
router.post('/scan', async (req, res) => {
    try {

        const userId = req.tokenPayload?.id;
        const {turnstileToken, entryType, note} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!turnstileToken) {
            return responseHelper.error(res, t('turnstile:turnstileMode.tokenMissing'), 400);
        }

        let turnstileTokenData;
        try {
            turnstileTokenData = await verifyToken(turnstileToken);
        } catch (error) {
            return responseHelper.error(res, t('turnstile:scan.invalidOrExpiredToken'), 400);
        }

        if (!turnstileTokenData.companyId) {
            return responseHelper.error(res, t('turnstile:scan.invalidOrExpiredToken'), 400);
        }

        const companyId = turnstileTokenData.companyId;

        await createEntry(userId, companyId, entryType, note );

        return responseHelper.success(res, {
            message: t('turnstile:scan.success')
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
