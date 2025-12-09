/**
 * @swagger
 * /transfers/approve:
 *   post:
 *     summary: Transfer'ı onayla
 *     description: |
 *       Belirtilen transfer ID'sine ait transfer'ı onaylar (pending -> completed).
 *       
 *       Yetkilendirme kuralları:
 *       - Transfer sahibi her zaman onaylayabilir
 *       - Transfer şirket adına yapıldıysa kullanıcının ilgili şirkette 'can_approve_transfers' yetkisi olmalıdır
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
 *         description: Transfer başarıyla onaylandı
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
 *                   example: "Transfer başarıyla onaylandı"
 *                 transferId:
 *                   type: string
 *                   description: Onaylanan transfer ID
 *                   example: "TRF_6370ee7e94b078d0"
 *       400:
 *         description: |
 *           Geçersiz istek - Olası durumlar:
 *           - Transfer ID eksik veya geçersiz
 *           - Transfer zaten onaylanmış
 *           - Transfer onaylanamaz durumda
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
 *           Erişim izni yok - Kullanıcı transfer sahibi değil ve 
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
 *                   example: "Bu transfer'ı onaylama yetkiniz yok"
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
const approveTransfer = require('../../../database/transfers/approveTransfer');
const getTransferById = require('../../../database/transfers/getTransferById');
const {t} = require('../../../config/i18n.config');
const responseHelper = require('../../utils/responseHelper');
const {checkUserRoles} = require("../../../utils/permissionsManager");

router.post('/approve', async (req, res) => {
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
        const transfer = await getTransferById(transferId, ['company_id', 'to_scope']);

        if (!transfer) {
            return responseHelper.error(res, t('transfers:getById.notFound'), 404);
        }

        if (transfer.user_id !== userId && transfer.to_scope === 'company') {
            if (!await checkUserRoles(transfer.user_id, transfer.company_id, ['can_approve_transfers'])) {
                return responseHelper.error(res, t('transfers:approveTransfer.noPermission'), 403);
            }
        }
        // Transfer'ı onayla
        const result = await approveTransfer(transferId, userId);
        return responseHelper.success(res, result);

    } catch (error) {

        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message, error.status || 400);
    }
});

module.exports = router;