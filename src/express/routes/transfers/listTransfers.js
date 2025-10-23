/**
 * @swagger
 * /transfers/list:
 *   get:
 *     summary: Transfer kayıtlarını listeler
 *     description: Transfer kayıtlarını çeşitli filtreleme seçenekleriyle listeler. Sayfalama ve sıralama destekler.
 *     tags: [Transfers]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Aranacak terim (id, açıklama, external isimler)
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Firma ID (gönderen veya alan firma)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Kullanıcı ID (işlemi yapan kullanıcı)
 *       - in: query
 *         name: toUserId
 *         schema:
 *           type: string
 *         description: Hedef kullanıcı ID
 *       - in: query
 *         name: toUserCompanyId
 *         schema:
 *           type: string
 *         description: Hedef firma ID
 *       - in: query
 *         name: transferType
 *         schema:
 *           type: string
 *         description: Transfer türü filtresi
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Transfer durumu filtresi
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Para birimi filtresi
 *       - in: query
 *         name: fromScope
 *         schema:
 *           type: string
 *         description: Kaynak scope filtresi
 *       - in: query
 *         name: toScope
 *         schema:
 *           type: string
 *         description: Hedef scope filtresi
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlangıç tarihi (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitiş tarihi (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Sayfa başına sonuç sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Atlanacak kayıt sayısı
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sayfa numarası (offset yerine kullanılabilir)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, amount, created_at, status, transfer_type, currency]
 *           default: created_at
 *         description: Sıralama alanı
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sıralama yönü
 *     responses:
 *       200:
 *         description: Transferler başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Transfers listed successfully
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
 *                           to_external_name:
 *                             type: string
 *                           from_external_name:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           transfer_type:
 *                             type: string
 *                           sender_final_balance:
 *                             type: number
 *                           receiver_final_balance:
 *                             type: number
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
 *       400:
 *         description: Geçersiz parametreler
 *       500:
 *         description: Sunucu hatası
 */

const express = require('express');
const router = express.Router();
const { listTransfers } = require('../../../database/transfers/listTransfers');
const { t } = require('../../../config/i18nConfig');
const responseHelper = require("../../utils/responseHelper");

router.get('/list', async (req, res) => {

    // Kullanıcı yetkisini kontrol et
    const userId = req.tokenPayload?.id;
    if (!userId) {
        return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
    }

    try {
        const {
            searchTerm,
            companyId,
            userId,
            toUserId,
            toUserCompanyId,
            transferType,
            status,
            currency,
            fromScope,
            toScope,
            startDate,
            endDate,
            limit,
            offset,
            page,
            sortBy,
            sortOrder
        } = req.query;

        let calculatedOffset = offset;
        if (page && !offset) {
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit) || 20;
            calculatedOffset = (pageNum - 1) * limitNum;
        }

        const searchOptions = {
            searchTerm: searchTerm || '',
            companyId: companyId || null,
            userId: userId || null,
            toUserId: toUserId || null,
            toUserCompanyId: toUserCompanyId || null,
            transferType: transferType || null,
            status: status || null,
            currency: currency || null,
            fromScope: fromScope || null,
            toScope: toScope || null,
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limit || 20,
            offset: calculatedOffset || 0,
            sortBy: sortBy || 'created_at',
            sortOrder: sortOrder || 'DESC'
        };

        const result = await listTransfers(searchOptions);
        return res.status(result.status).json(result);

    } catch (error) {
        console.error('Transfer listeleme hatas1:', error);
        return res.status(error.status || 500).json({
            status: error.status || 500,
            message: error.message || t('transfers:list.error'),
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

module.exports = router;
