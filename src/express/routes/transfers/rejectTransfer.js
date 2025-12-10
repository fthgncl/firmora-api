/**
 * @swagger
 * /transfers/reject:
 *   post:
 *     summary: Transfer'ı reddet
 *     description: |
 *       Belirtilen transfer ID'sine ait transfer'ı reddeder (pending -> rejected).
 *
 *       Yetkilendirme kuralları:
 *       - Transfer alıcısı (to_scope='user' ise to_user_id kontrolü)
 *       - Transfer şirket adına yapıldıysa (to_scope='company') kullanıcının ilgili şirkette 'can_approve_transfers' yetkisi olmalıdır
 *     tags:
 *       - Transfers
 *     security:
 *       - ApiKeyAuth: []
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
 *         description: Transfer başarıyla reddedildi
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
 *                   example: "Transfer başarıyla reddedildi"
 *                 transferId:
 *                   type: string
 *                   description: Reddedilen transfer ID
 *                   example: "TRF_6370ee7e94b078d0"
 *       400:
 *         description: |
 *           Geçersiz istek - Olası durumlar:
 *           - Transfer ID eksik veya geçersiz
 *           - Transfer zaten reddedilmiş veya onaylanmış
 *           - Transfer reddedilemez durumda
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
 *         description: Kimlik doğrulama hatası - Token eksik veya geçersiz
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
 *         description: |
 *           Erişim izni yok - Kullanıcı transfer alıcısı değil ve
 *           ilgili şirkette 'can_approve_transfers' yetkisi yok
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
 *                   example: "Bu transfer'ı reddetme yetkiniz yok"
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
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {rejectTransfer} = require("../../../database/transfers");

router.post('/reject', async (req, res) => {
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
        const transfer = await getTransferById(transferId, ['user_id', 'to_user_company_id', 'to_scope']);

        if (!transfer) {
            return responseHelper.error(res, t('transfers:getById.notFound'), 404);
        }

        if (transfer.to_scope === 'company') {
            if (!await checkUserRoles(transfer.user_id, transfer.to_user_company_id, ['can_approve_transfers'])) {
                return responseHelper.error(res, t('transfers:rejectTransfer.noPermission'), 403);
            }
        }
        if (transfer.to_scope === 'user') {
            if (transfer.to_user_id !== userId) {
                return responseHelper.error(res, t('transfers:rejectTransfer.noPermission'), 403);
            }
        }

        // Transfer'ı onayla
        const result = await rejectTransfer(transferId, userId);
        return responseHelper.success(res, result);

    } catch (error) {

        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message, error.status || 400);
    }
});

module.exports = router;