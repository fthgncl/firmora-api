/**
 * @swagger
 * /companies:
 *   put:
 *     summary: Firma bilgilerini güncelle
 *     description: Mevcut bir firmanın bilgilerini günceller. Sadece firma sahibi güncelleyebilir. companyId zorunlu, diğer alanlardan en az biri gönderilmelidir.
 *     operationId: updateCompany
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Güncellenecek firmanın ID'si (zorunlu)
 *                 example: "COM_d1e589e2a7d9c699"
 *               company_name:
 *                 type: string
 *                 description: Firma adı (opsiyonel)
 *                 example: "ABC Teknoloji A.Ş."
 *               sector:
 *                 type: string
 *                 description: Sektör (opsiyonel)
 *                 example: "Teknoloji"
 *               currency:
 *                 type: string
 *                 description: Para birimi - 3 harfli kod (opsiyonel)
 *                 example: "TRY"
 *                 pattern: "^[A-Z]{3}$"
 *     responses:
 *       200:
 *         description: Firma başarıyla güncellendi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Firma bilgileri başarıyla güncellendi.
 *                 updatedFields:
 *                   type: object
 *                   description: Güncellenen alanlar
 *                   properties:
 *                     company_name:
 *                       type: string
 *                       example: "ABC Teknoloji A.Ş."
 *                     sector:
 *                       type: string
 *                       example: "Teknoloji"
 *                     currency:
 *                       type: string
 *                       example: "TRY"
 *       400:
 *         description: Geçersiz giriş bilgileri, güncelleme verisi yok veya benzersizlik ihlali.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Güncellenecek veri bulunamadı.
 *                   description: Mesaj duruma göre değişir (companyId eksik, veri yok, geçersiz alanlar, benzersizlik ihlali)
 *                 errorMessages:
 *                   type: object
 *                   description: Hata detayları (varsa)
 *                   properties:
 *                     general:
 *                       type: string
 *                       example: Geçerli güncellenebilir alan bulunamadı.
 *                     username:
 *                       type: string
 *                       example: Bu firma adı zaten kullanılmaktadır.
 *             examples:
 *               companyIdMissing:
 *                 summary: CompanyId eksik
 *                 value:
 *                   status: error
 *                   message: Firma ID'si gereklidir.
 *               noUpdateData:
 *                 summary: Güncelleme verisi yok
 *                 value:
 *                   status: error
 *                   message: Güncellenecek veri bulunamadı.
 *               noValidFields:
 *                 summary: Geçersiz alanlar
 *                 value:
 *                   status: error
 *                   message: Geçerli güncellenebilir alan bulunamadı.
 *                   errorMessages:
 *                     general: Geçerli güncellenebilir alan bulunamadı.
 *               uniquenessViolation:
 *                 summary: Benzersizlik ihlali - Firma adı çakışması
 *                 value:
 *                   status: error
 *                   message: Bu bilgiler zaten kayıtlı.
 *                   errorMessages:
 *                     username: Bu firma adı zaten kullanılmaktadır.
 *       401:
 *         description: Yetkisiz erişim - Token eksik veya geçersiz.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Token eksik veya geçersiz.
 *       403:
 *         description: Yasaklandı - Sadece firma sahibi güncelleyebilir.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Bu firmayı güncelleme yetkiniz yok. Sadece firma sahibi güncelleyebilir.
 *       404:
 *         description: Firma bulunamadı.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Firma bulunamadı.
 *       500:
 *         description: Sunucu hatası.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Sunucu hatası oluştu.
 *                 errorMessages:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: string
 *                       example: Bilinmeyen bir hata oluştu.
 */

const express = require('express');
const router = express.Router();
const updateCompany = require('../../../database/companies/updateCompany');
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {getCompanyById} = require("../../../database/companies");

// Error handling for duplicate entries


router.put('/', async (req, res) => {

    const userId = req.tokenPayload?.id;
    if (!userId) {
        return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
    }

    const data = req.body;
    const { companyId } = data;


    // companyId kontrolü
    if (!companyId) {
        return responseHelper.error(res, t('companies:update.companyIdRequired'), 400);
    }

    const {owner_id} = await getCompanyById(companyId, ['owner_id']);
    if ( userId !== owner_id ){
        return responseHelper.error(res, t('companies:update.youNotCompanyOwner'), 403);
    }

    try {
        const result = await updateCompany(companyId, data);
        return responseHelper.success(res, result, 200);
    } catch (error) {
        const {message, statusCode, errorMessages} = error;
        return responseHelper.error(res, message, statusCode, { errors: errorMessages });
    }
});

module.exports = router;