/**
 * @swagger
 * /transfers/pending:
 *   get:
 *     summary: Onay bekleyen transferleri listele
 *     description: |
 *       Kullanıcının onaylaması gereken bekleyen (pending) transferleri listeler.
 *       
 *       **Listelenen Transferler:**
 *       
 *       1. **Kişisel Transferler:** Kullanıcıya doğrudan gönderilen bekleyen transferler
 *       
 *       2. **Firma Transferleri:** Kullanıcının `can_approve_transfers` yetkisine sahip olduğu 
 *          firmalara gönderilen bekleyen transferler
 *       
 *       **Özellikler:**
 *       - Transferler tarihe göre sıralanır (en yeni önce)
 *       - Tekrar eden kayıtlar otomatik olarak filtrelenir
 *     tags:
 *       - Transfers
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Bekleyen transferler başarıyla listelendi
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
 *                   example: "Bekleyen transferler başarıyla listelendi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transfers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user_id:
 *                             type: string
 *                           company_id:
 *                             type: string
 *                           to_user_id:
 *                             type: string
 *                           to_user_company_id:
 *                             type: string
 *                           from_scope:
 *                             type: string
 *                           to_scope:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           transfer_type:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           files_count:
 *                             type: integer
 *                           sender_name:
 *                             type: string
 *                           sender_surname:
 *                             type: string
 *                           sender_company_name:
 *                             type: string
 *                           receiver_name:
 *                             type: string
 *                           receiver_surname:
 *                             type: string
 *                           receiver_company_name:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
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
const { listTransfers } = require('../../../database/transfers/listTransfers');
const { t } = require('../../../config/i18n.config');
const responseHelper = require('../../utils/responseHelper');
const { readUserPermissions, checkUserRoles } = require("../../../utils/permissionsManager");

router.get('/pending', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Kullanıcıya gönderilen pending transferleri listele
        const userTransfersResult = await listTransfers({
            toUserId: userId,
            status: 'pending'
        });

        let allTransfers = [...userTransfersResult.data.transfers];

        // Kullanıcının yetkili olduğu firmaları kontrol et
        const { permissions } = await readUserPermissions(userId);

        // Yetkili olunan firmaların pending transferlerini ekle
        for (const perm of permissions) {
            const hasPermission = await checkUserRoles(userId, perm.companyId, ['can_approve_transfers']);

            if (hasPermission) {
                // Firmaya gönderilen pending transferleri al
                const companyTransfersResult = await listTransfers({
                    toUserCompanyId: perm.companyId,
                    fromScope: 'company',
                    status: 'pending'
                });

                // Firma transferlerini ana listeye ekle (tekrar etmemesi için ID kontrolü)
                const existingIds = new Set(allTransfers.map(t => t.id));
                companyTransfersResult.data.transfers.forEach(transfer => {
                    if (!existingIds.has(transfer.id)) {
                        allTransfers.push(transfer);
                    }
                });
            }
        }

        // Transferleri tarihe göre sırala (en yeni önce)
        allTransfers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return responseHelper.success(res, {
            transfers: allTransfers,
            pagination: {
                total: allTransfers.length,
                limit: allTransfers.length,
                offset: 0,
                currentPage: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false
            }
        });

    } catch (error) {
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message, error.status || 500);
    }
});

module.exports = router;