const express = require('express');
const router = express.Router();
const getUserById = require('../../../database/users/getUserById');
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {createToken} = require("../../../auth/jwt");
const {getCompanyById} = require("../../../database/companies");

/**
 * @swagger
 * /turnstile/auth:
 *   post:
 *     tags:
 *       - Turnstile
 *     summary: Turnstile modu için token oluştur
 *     description: Kullanıcının turnstile yetkisini kontrol eder ve giriş-çıkış işlemleri için özel token oluşturur
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: Turnstile moduna geçilecek firma ID'si
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Turnstile token başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Turnstile modu etkinleştirildi"
 *                 token:
 *                       type: string
 *                       description: Giriş-çıkış işlemleri için kullanılacak token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Firma ID'si eksik
 *       401:
 *         description: Token eksik veya geçersiz
 *       403:
 *         description: Kullanıcının turnstile yetkisi yok
 *       500:
 *         description: Sunucu hatası
 */
router.post('/auth', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {companyId} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!companyId) {
            return responseHelper.error(res, t('turnstile:turnstileMode.companyIdRequired'), 400);
        }

        const hasTurnstileRole = await checkUserRoles(userId, companyId, ['can_act_as_turnstile'])

        if (!hasTurnstileRole) {
            return responseHelper.error(res, t('turnstile:turnstileMode.forbidden'), 403);
        }

        const user = await getUserById(userId,['id','name','surname']);
        const company = await getCompanyById(companyId, ['id','company_name'])
        console.log(company);
        const turnstileTokenPayload = {
            company,
            createdBy: user
        };


        const token = createToken(turnstileTokenPayload, process.env.TURNSTILE_AUTH_TOKEN_LIFETIME )

        return responseHelper.success(res, {
            message: t('turnstile:turnstileMode.enabled'),
            token
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;

