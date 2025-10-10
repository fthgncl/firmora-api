const express = require('express');
const router = express.Router();
const createTransfer = require('../../../database/transfers/createTransfer');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');

/**
 * @swagger
 * /transfers:
 *   post:
 *     summary: Yeni para transferi oluştur
 *     description: Yeni bir para transferi kaydı oluşturur (transfer yetkisi gerekli)
 *     tags:
 *       - Transfers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - currency
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [internal, external_company, external_person, expense]
 *                 description: Transfer tipi
 *                 example: "internal"
 *               amount:
 *                 type: number
 *                 description: Transfer miktarı
 *                 example: 1000.50
 *               currency:
 *                 type: string
 *                 description: Para birimi
 *                 example: "USD"
 *               description:
 *                 type: string
 *                 description: Transfer açıklaması
 *                 example: "Aylık maaş ödemesi"
 *               to_user_id:
 *                 type: string
 *                 description: Alıcı kullanıcı ID (internal veya external_company için gerekli)
 *                 example: "USR123456"
 *               from_user_id:
 *                 type: string
 *                 description: Gönderen kullanıcı ID (internal veya external_company için gerekli)
 *                 example: "USR789012"
 *               external_person_name:
 *                 type: string
 *                 description: Harici kişi adı (external_person için gerekli)
 *                 example: "John Doe"
 *               expense_category:
 *                 type: string
 *                 description: Gider kategorisi (expense için gerekli)
 *                 example: "Office Supplies"
 *     responses:
 *       200:
 *         description: Transfer başarıyla oluşturuldu
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
 *                   example: "Transfer başarıyla oluşturuldu"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transfer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "TRF123456"
 *                         type:
 *                           type: string
 *                           example: "internal"
 *                         amount:
 *                           type: number
 *                           example: 1000.50
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *                         description:
 *                           type: string
 *                           example: "Aylık maaş ödemesi"
 *       400:
 *         description: Gerekli alanlar eksik veya geçersiz
 *       403:
 *         description: Yetki yetersiz (transfer yetkisi gerekli)
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', async (req, res) => {
    try {
        // Kullanıcı bilgilerini al
        const userId = req.tokenPayload?.id;
        const companyId = req.headers['x-company-id'];

        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        if (!companyId) {
            return responseHelper.error(res, t('companies.companyIdRequired'), 400);
        }

        // Gerekli alanları kontrol et
        const { type, amount, currency } = req.body;
        if (!type || !amount || !currency) {
            return responseHelper.error(res, t('transfers.create.missingFields'), 400);
        }

        // Transfer oluştur
        const result = await createTransfer(req.body, userId, companyId);

        return responseHelper.success(res, {
            message: result.message,
            transfer: result.transfer
        });

    } catch (error) {

        // Özel hata durumlarını kontrol et
        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
