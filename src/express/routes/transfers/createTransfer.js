/**
 * @swagger
 * /transfers/create-transfer:
 *   post:
 *     summary: Yeni transfer oluştur
 *     description: Farklı transfer tipleri ile para transferi gerçekleştirir (ilgili yetki gerekli)
 *     tags:
 *       - Transfers
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - transfer_type
 *               - from_scope
 *               - to_scope
 *               - amount
 *               - currency
 *             properties:
 *               company_id:
 *                 type: string
 *                 description: İşlemi yapan kullanıcının firma ID'si (kaynak firma)
 *                 example: "COM123456"
 *               transfer_type:
 *                 type: string
 *                 enum:
 *                   - company_to_user_same
 *                   - company_to_user_other
 *                   - company_to_company_other
 *                   - user_to_user_same
 *                   - user_to_user_other
 *                   - user_to_company_same
 *                   - user_to_company_other
 *                 description: |
 *                   Transfer tipi:
 *                   - company_to_user_same: Firma hesabından aynı firmadaki kullanıcıya
 *                   - company_to_user_other: Firma hesabından başka firmadaki kullanıcıya
 *                   - company_to_company_other: Firma hesabından başka firmaya
 *                   - user_to_user_same: Kullanıcı hesabından aynı firmadaki kullanıcıya
 *                   - user_to_user_other: Kullanıcı hesabından başka firmadaki kullanıcıya
 *                   - user_to_company_same: Kullanıcı hesabından kendi firmasına
 *                   - user_to_company_other: Kullanıcı hesabından başka firmaya
 *                 example: "company_to_user_same"
 *               from_scope:
 *                 type: string
 *                 enum: [user, company]
 *                 description: Para çıkışının kaynağı
 *                 example: "company"
 *               to_scope:
 *                 type: string
 *                 enum: [user, company]
 *                 description: Para girişinin hedefi
 *                 example: "user"
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 description: Transfer miktarı (pozitif, maksimum 2 ondalık basamak)
 *                 example: 1000.50
 *               currency:
 *                 type: string
 *                 description: Para birimi (ISO 4217 formatında, 3 büyük harf)
 *                 pattern: "^[A-Z]{3}$"
 *                 example: "USD"
 *               to_user_id:
 *                 type: string
 *                 description: Hedef kullanıcı ID'si (user hedefli transferlerde zorunlu)
 *                 example: "USR789012"
 *               to_user_company_id:
 *                 type: string
 *                 description: Hedef firma ID'si (başka firmaya yapılan transferlerde zorunlu)
 *                 example: "COM654321"
 *               description:
 *                 type: string
 *                 description: Transfer açıklaması (opsiyonel)
 *                 maxLength: 255
 *                 example: "Aylık maaş ödemesi"
 *               to_external_name:
 *                 type: string
 *                 description: Sistem dışı alıcı adı (opsiyonel)
 *                 maxLength: 120
 *                 example: "Harici Tedarikçi A.Ş."
 *               attachments:
 *                 type: array
 *                 description: Transfer ile ilgili ekler (makbuz, fatura vb. - opsiyonel, maksimum dosya sayısı uploadConfig'de tanımlı)
 *                 items:
 *                   type: string
 *                   format: binary
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
 *                     transferId:
 *                       type: string
 *                       example: "TRF123456"
 *       400:
 *         description: Gerekli alanlar eksik veya geçersiz veri
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
 *                   example: "Geçersiz miktar veya yetersiz bakiye"
 *       401:
 *         description: Token gerekli veya geçersiz
 *       403:
 *         description: Yetki yetersiz (ilgili transfer yetkisi gerekli)
 *       500:
 *         description: Sunucu hatası
 */

const express = require('express');
const router = express.Router();
const createTransfer = require('../../../database/transfers/createTransfer');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');
const { uploadConfig } = require('../../config/uploadConfig');
const uploadMiddleware = require('../../middleware/uploadMiddleware');

router.post('/create', uploadMiddleware(uploadConfig.receipt.maxFileCount), async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const transferData = req.body;
        const uploadedFiles = req.files || null;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Firma ID kontrolü
        if (!transferData?.company_id) {
            return responseHelper.error(res, t('companies:get.companyIdRequired'), 400);
        }

        // Transfer oluştur - dosyaları da parametre olarak gönder
        const result = await createTransfer(transferData, userId, transferData.company_id, uploadedFiles);

        return responseHelper.success(res, {
            message: result.message,
            transferId: result.transferId
        });

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;

