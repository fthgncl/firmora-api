const express = require('express');
const router = express.Router();
const getAccountsByUserId = require('../../../database/accounts/getAccountsByUserId');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Kullanıcının hesaplarını listele
 *     description: Token'dan alınan kullanıcıya ait tüm hesapları getirir. İsteğe bağlı olarak firma filtresi uygulanabilir.
 *     tags:
 *       - Accounts
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Belirli bir firmaya ait hesapları filtrelemek için firma ID'si (opsiyonel)
 *                 example: "COM_547dc37210f0157d"
 *     responses:
 *       200:
 *         description: Hesaplar başarıyla getirildi
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
 *                   example: "Hesaplar başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "ACC_1a2b3c4d5e6f7g8h"
 *                           user_id:
 *                             type: string
 *                             example: "USR_f1eb361f6dcd6ba4"
 *                           company_id:
 *                             type: string
 *                             example: "COM_547dc37210f0157d"
 *                           currency:
 *                             type: string
 *                             example: "EUR"
 *                           balance:
 *                             type: number
 *                             format: decimal
 *                             example: 1500.50
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-15T10:30:00Z"
 *       401:
 *         description: Token geçersiz veya eksik
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
 *                   example: "Geçersiz token"
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
 *                   example: "Sunucu hatası"
 */
router.get('/', async (req, res) => {
    try {
        // Token'dan userId'yi al
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        // Opsiyonel firma ID filtresi

        // Kullanıcının hesaplarını getir
        const result = await getAccountsByUserId(userId);

        return responseHelper.success(res, {
            message: result.message,
            accounts: result.accounts
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;