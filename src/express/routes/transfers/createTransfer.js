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
 *     description: |
 *       Yeni bir para transferi kaydı oluşturur. Transfer tiplerine göre farklı yetkiler gereklidir:
 *       - user_same_company: can_transfer_internal
 *       - user_other_company: can_transfer_external
 *       - external: can_transfer_external
 *       - expense: can_record_expense
 *       - incoming_manual: can_record_income
 *       
 *       Ayrıca from_scope='company' ise can_withdraw_from_company yetkisi gerekir.
 *     tags:
 *       - Transfers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_kind
 *               - amount
 *               - currency
 *               - from_scope
 *             properties:
 *               to_kind:
 *                 type: string
 *                 enum: [user_same_company, user_other_company, external, expense, incoming_manual]
 *                 description: |
 *                   Transfer tipi:
 *                   - user_same_company: Aynı firmadaki kullanıcıya
 *                   - user_other_company: Farklı firmadaki kullanıcıya
 *                   - external: Sistemde olmayan kişiye ödeme
 *                   - expense: Gider ödemesi
 *                   - incoming_manual: Dışarıdan gelen para kaydı
 *                 example: "user_same_company"
 *               from_scope:
 *                 type: string
 *                 enum: [user, company]
 *                 description: |
 *                   Para çıkış kaynağı:
 *                   - user: Kullanıcının hesabından
 *                   - company: Firma hesabından
 *                 example: "user"
 *               amount:
 *                 type: number
 *                 description: Transfer miktarı (pozitif sayı)
 *                 example: 1000.50
 *               currency:
 *                 type: string
 *                 description: Para birimi (ISO-4217, 3 büyük harf)
 *                 example: "USD"
 *               description:
 *                 type: string
 *                 description: Transfer açıklaması
 *                 example: "Aylık maaş ödemesi"
 *               to_user_id:
 *                 type: string
 *                 description: Alıcı kullanıcı ID (user_same_company veya user_other_company için gerekli)
 *                 example: "USR123456"
 *               to_user_company_id:
 *                 type: string
 *                 description: Alıcı kullanıcının firma ID'si (sadece user_other_company için gerekli)
 *                 example: "CMP789012"
 *               to_external_name:
 *                 type: string
 *                 description: Harici kişi/kurum adı (external veya incoming_manual için gerekli)
 *                 example: "Tedarikçi A.Ş."
 *               to_expense_name:
 *                 type: string
 *                 description: Gider adı/kategorisi (expense için gerekli)
 *                 example: "Ofis Malzemeleri"
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
 *                         to_kind:
 *                           type: string
 *                           example: "user_same_company"
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
 *         description: Yetki yetersiz
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', async (req, res) => {
    try {
        // Kullanıcı bilgilerini al
        const userId = req.tokenPayload?.id;
        const { to_kind, amount, company_id, currency, from_scope } = req.body;

        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        if (!company_id) {
            console.log('companyId', company_id);
            return responseHelper.error(res, t('companies.companyIdRequired'), 400);
        }

        // Gerekli alanları kontrol et
        if (!to_kind || !amount || !currency || !from_scope) {
            return responseHelper.error(res, t('transfers.create.missingFields'), 400);
        }

        // Transfer oluştur
        const result = await createTransfer(req.body, userId, company_id);

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
