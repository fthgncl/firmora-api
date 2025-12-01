/**
 * @swagger
 * /transfers/get:
 *   post:
 *     summary: Transfer detaylarını getir
 *     description: |
 *       Belirtilen transfer ID'sine ait tüm detayları getirir.
 *       Kullanıcı, transfer'a erişim yetkisine sahip olmalıdır.
 *       (Transfer'ın gönderen veya alıcısı ya da ilgili firma yetkilisi olmalıdır)
 *     tags:
 *       - Transfers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transferId
 *             properties:
 *               transferId:
 *                 type: string
 *                 description: Transfer ID
 *                 example: "TRF_6370ee7e94b078d0"
 *     responses:
 *       200:
 *         description: Transfer detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Transfer başarıyla alındı"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transfer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Transfer ID
 *                           example: "TRF_8faff14f18396124"
 *                         user_id:
 *                           type: string
 *                           nullable: true
 *                           description: Gönderen kullanıcı ID (internal transferlerde)
 *                           example: "USR_18ef2ebec4013b71"
 *                         company_id:
 *                           type: string
 *                           nullable: true
 *                           description: Gönderen firma ID (internal transferlerde)
 *                           example: "COM_d1e589e2a7d9c699"
 *                         to_user_id:
 *                           type: string
 *                           nullable: true
 *                           description: Alıcı kullanıcı ID
 *                           example: "USR_18ef2ebec4013b72"
 *                         to_user_company_id:
 *                           type: string
 *                           nullable: true
 *                           description: Alıcı kullanıcının firma ID
 *                           example: "COM_d1e589e2a7d9c699"
 *                         from_scope:
 *                           type: string
 *                           enum: [user, company, external]
 *                           description: Para çıkışının kaynağı
 *                           example: "user"
 *                         to_scope:
 *                           type: string
 *                           enum: [user, company, external]
 *                           description: Para girişinin hedefi
 *                           example: "user"
 *                         amount:
 *                           type: number
 *                           format: decimal
 *                           description: Transfer miktarı (kuruş/cent cinsinden)
 *                           example: 123
 *                         currency:
 *                           type: string
 *                           description: Para birimi (ISO 4217)
 *                           example: "TRY"
 *                         description:
 *                           type: string
 *                           nullable: true
 *                           description: Transfer açıklaması
 *                           example: null
 *                         status:
 *                           type: string
 *                           enum: [pending, completed, failed, cancelled]
 *                           description: Transfer durumu
 *                           example: "completed"
 *                         to_external_name:
 *                           type: string
 *                           nullable: true
 *                           description: Sistem dışı alıcı adı
 *                           example: null
 *                         from_external_name:
 *                           type: string
 *                           nullable: true
 *                           description: Sistem dışı gönderici adı
 *                           example: null
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           description: Transfer oluşturma zamanı
 *                           example: "2025-11-12T14:22:38.000Z"
 *                         sender_final_balance:
 *                           type: number
 *                           nullable: true
 *                           description: Gönderici son bakiye (kuruş/cent cinsinden)
 *                           example: 258492
 *                         receiver_final_balance:
 *                           type: number
 *                           nullable: true
 *                           description: Alıcı son bakiye (kuruş/cent cinsinden)
 *                           example: 174123
 *                         transfer_type:
 *                           type: string
 *                           enum:
 *                             - company_to_user_same
 *                             - company_to_user_other
 *                             - company_to_company_other
 *                             - user_to_user_same
 *                             - user_to_user_other
 *                             - user_to_company_same
 *                             - user_to_company_other
 *                             - external_to_user
 *                             - external_to_company
 *                             - user_to_external
 *                             - company_to_external
 *                           description: Transfer tipi
 *                           example: "user_to_user_same"
 *                     sender:
 *                       type: object
 *                       nullable: true
 *                       description: Gönderen kullanıcı bilgileri
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: Gönderen kullanıcı adı
 *                           example: "Fatih"
 *                         surname:
 *                           type: string
 *                           description: Gönderen kullanıcı soyadı
 *                           example: "Gencal"
 *                     receiver:
 *                       type: object
 *                       nullable: true
 *                       description: Alıcı kullanıcı bilgileri
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: Alıcı kullanıcı adı
 *                           example: "Hasan"
 *                         surname:
 *                           type: string
 *                           description: Alıcı kullanıcı soyadı
 *                           example: "Yılmaz"
 *       400:
 *         description: Geçersiz transfer ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Transfer ID gereklidir"
 *       401:
 *         description: Kimlik doğrulama hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Token eksik veya geçersiz"
 *       403:
 *         description: Erişim izni yok
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Bu transfer'ı görüntüleme yetkiniz yok"
 *       404:
 *         description: Transfer bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Transfer bulunamadı"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası"
 */

const express = require('express');
const router = express.Router();
const getTransferById = require('../../../database/transfers/getTransferById');
const {t} = require('../../../config/i18n.config');
const responseHelper = require('../../utils/responseHelper');
const {canUserViewTransfer} = require('../../../utils/permissionsManager');
const getUserById = require("../../../database/users/getUserById");
const filterTransfersByUserPermissions = require("../../../database/utils/filterTransfersByUserPermissions");

router.post('/get', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {transferId} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Transfer ID kontrolü
        if (!transferId) {
            return responseHelper.error(res, t('transfers:getById.transferIdRequired'), 400);
        }

        // Transfer bilgilerini çek
        const transfer = await getTransferById(transferId);

        if (!await canUserViewTransfer(userId, transfer)) {
            return responseHelper.error(res, t('errors:permissions.cannotViewOtherUserTransferHistory'), 403);
        }

        if (!transfer) {
            return responseHelper.error(res, t('transfers:getById.notFound'), 404);
        }

        delete transfer.files;

        let sender = null;
        if (transfer.user_id) {
            sender = await getUserById(transfer.user_id, ['name', 'surname']);
            await filterTransfersByUserPermissions(userId,transfer);
        }


        let receiver = null;
        if (transfer.to_user_id) {
            receiver = await getUserById(transfer.to_user_id, ['name', 'surname']);
        }

        return responseHelper.success(res, {
            data: {
                transfer,
                sender,
                receiver
            },
            message: t('transfers:getById.success')
        });

    } catch (error) {
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message, error.status || 400);
    }
});

module.exports = router;