/**
 * @swagger
 * /accounts/get:
 *   post:
 *     summary: ID'ye göre hesap bilgisi getir
 *     description: Belirtilen ID'ye sahip hesabın detaylı bilgilerini getirir. Kullanıcının hesabı görüntüleme yetkisi olmalıdır.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Hesap ID'si
 *                 example: "ACC_1a2b3c4d5e6f7g8h"
 *     responses:
 *       200:
 *         description: Hesap bilgisi başarıyla getirildi
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
 *                   example: "Hesap başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Hesap başarıyla getirildi"
 *                     account:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "ACC_1a2b3c4d5e6f7g8h"
 *                         name:
 *                           type: string
 *                           example: "Ahmet Yılmaz"
 *                         balance:
 *                           type: number
 *                           format: decimal
 *                           example: 15000.50
 *                         currency:
 *                           type: string
 *                           example: "TRY"
 *                         account_type:
 *                           type: string
 *                           example: "checking"
 *                         status:
 *                           type: string
 *                           example: "active"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-20T14:45:00Z"
 *                     company:
 *                       type: object
 *                       nullable: true
 *                       description: Hesaba ait firma bilgileri
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "COM_547dc37210f0157d"
 *                         company_name:
 *                           type: string
 *                           example: "Örnek Teknoloji A.Ş."
 *                         sector:
 *                           type: string
 *                           nullable: true
 *                           example: "Teknoloji"
 *                         currency:
 *                           type: string
 *                           example: "TRY"
 *       400:
 *         description: Geçersiz istek parametreleri
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
 *                   example: "Hesap ID'si gereklidir"
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
 *       403:
 *         description: Yetkisiz erişim - Kullanıcının hesabı görüntüleme yetkisi yok
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
 *                   example: "Bu hesaba erişim yetkiniz yok"
 *       404:
 *         description: Hesap bulunamadı
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
 *                   example: "Hesap bulunamadı"
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

const express = require('express');
const router = express.Router();
const getAccountById = require('../../../database/accounts/getAccountById');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18n.config');
const {checkUserRoles} = require("../../../utils/permissionsManager");

router.post('/get', async (req, res) => {
    try {
        // Token'dan userId'yi al
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        const { accountId } = req.body;

        // Hesap bilgisini getir
        const result = await getAccountById(accountId);
        const {data:{account,company}} = result;

        if ( account.user_id !== userId && !await checkUserRoles(userId, company.id, ['can_view_other_users_transfer_history'] ) ){
            return responseHelper.error(res, t('accounts:getById.unauthorized'), 403);
        }

        return responseHelper.success(res, {
            message: result.message,
            account,
            company
        });

    } catch (error) {
        // Hata nesnesinde status kodu varsa kontrol et
        if (error.status) {
            // 400-499 arası client hataları
            if (error.status >= 400 && error.status < 500) {
                return responseHelper.error(res, error.message, error.status);
            }
            // 500 ve üzeri sunucu hataları
            return responseHelper.serverError(res, error);
        }
        // Status kodu yoksa sunucu hatası olarak değerlendir
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;