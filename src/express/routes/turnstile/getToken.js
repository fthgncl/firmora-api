const express = require('express');
const router = express.Router();
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {createToken, verifyToken} = require("../../../auth/jwt");

/**
 * @swagger
 * /turnstile/get-token/{turnstileToken}:
 *   get:
 *     tags:
 *       - Turnstile
 *     summary: QR kod için kullanıcı tokenı oluştur
 *     description: |
 *       Kullanıcının giriş-çıkış yapabilmesi için QR kod içinde kullanılacak tokenı üretir.
 *       
 *       Kullanım Senaryosu:
 *       1. Turnstile yetkilisi /turnstile/auth ile turnstile tokenı alır
 *       2. Bu endpointe turnstile tokenı URL parametresi olarak gönderilir
 *       3. Dönen token QR koda dönüştürülür
 *       4. Kullanıcı QR kodu okutarak giriş/çıkış yapar
 *       
 *       Not: Bu endpoint herhangi bir authentication gerektirmez. QR kod üretimi için herkese açıktır.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: turnstileToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Turnstile auth endpointinden alınan turnstile tokeni
 *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiI1NTBlODQwMCJ9.abc123"
 *     responses:
 *       200:
 *         description: Token başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token başarıyla oluşturuldu"
 *                 token:
 *                   type: string
 *                   description: QR koda dönüştürülecek kullanıcı tokeni
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiI1NTBlODQwMCJ9.xyz789"
 *             examples:
 *               success:
 *                 summary: Başarılı token oluşturma
 *                 value:
 *                   success: true
 *                   message: "Token başarıyla oluşturuldu"
 *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Turnstile token eksik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Turnstile token gerekli"
 *       401:
 *         description: Turnstile token geçersiz veya süresi dolmuş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token geçersiz"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Token oluşturulurken hata oluştu"
 */
router.get('/get-token/:turnstileToken', async (req, res) => {
    try {
        const {turnstileToken} = req.params;
        let companyId;

        if (!turnstileToken) {
            return responseHelper.error(res, t('turnstile:turnstileMode.tokenMissing'), 400);
        }

        try {
            const turnstileTokenData = await verifyToken(turnstileToken);
            companyId = turnstileTokenData.company.id;
        } catch (tokenError) {
            return responseHelper.error(res, t('errors:auth.tokenInvalid'), 401);
        }

        const token = createToken({companyId}, process.env.TURNSTILE_TOKEN_LIFETIME )


        return responseHelper.success(res, {
            message: t('turnstile:getToken.tokenGenerated'),
            token
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;

