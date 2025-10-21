/**
 * @swagger
 * /companies/get:
 *   post:
 *     summary: Firma bilgilerini getir
 *     description: |
 *       Belirtilen ID'ye sahip firmanın detaylı bilgilerini getirir.
 *
 *       ## Dönen Bilgiler
 *
 *       - Firma ID ve adı
 *       - Sektör bilgisi
 *       - Para birimi (currency)
 *       - Mevcut bakiye
 *       - Firma sahibi ID
 *       - Oluşturulma tarihi
 *
 *       ## Yetkilendirme
 *
 *       Bu endpoint kimlik doğrulaması gerektirir. Kullanıcı sadece aşağıdaki durumlarda
 *       firma bilgilerine erişebilir:
 *
 *       - Firmanın sahibi ise
 *       - Firmada `sys_admin` yetkisine sahipse
 *       - Firmada `personnel_manager` yetkisine sahipse
 *
 *       ## Kullanım Senaryoları
 *
 *       - Firma detay sayfası
 *       - Firma ayarları
 *       - Bakiye görüntüleme
 *       - Firma raporlama
 *
 *     tags:
 *       - Companies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Firma ID bilgisi
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   Bilgileri getirilecek firma ID
 *
 *                   36 karakter uzunluğunda UUID formatında olmalıdır.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *           examples:
 *             basic:
 *               summary: Basit istek
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Başarılı - Firma bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: İşlem başarı durumu
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: İşlem sonucu mesajı
 *                   example: "Firma bilgileri başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   required:
 *                     - id
 *                     - company_name
 *                     - currency
 *                     - balance
 *                     - owner_id
 *                     - created_at
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: Firma ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     company_name:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 50
 *                       description: Firma adı (2-50 karakter)
 *                       example: "Acme Corporation"
 *                     sector:
 *                       type: string
 *                       maxLength: 50
 *                       nullable: true
 *                       description: Firma sektörü (opsiyonel)
 *                       example: "Teknoloji"
 *                     currency:
 *                       type: string
 *                       pattern: '^[A-Z]{3}$'
 *                       description: Para birimi (3 karakter ISO 4217 kodu)
 *                       example: "EUR"
 *                       enum: [EUR, USD, TRY, GBP]
 *                     balance:
 *                       type: number
 *                       format: decimal
 *                       description: Firma bakiyesi (15 basamak, 2 ondalık)
 *                       example: 125000.50
 *                     owner_id:
 *                       type: string
 *                       format: uuid
 *                       description: Firma sahibi kullanıcı ID
 *                       example: "223e4567-e89b-12d3-a456-426614174001"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Firma oluşturulma tarihi
 *                       example: "2024-01-15T10:30:00.000Z"
 *             examples:
 *               successWithSector:
 *                 summary: Başarılı (sektör bilgisi ile)
 *                 value:
 *                   success: true
 *                   message: "Firma bilgileri başarıyla getirildi"
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     company_name: "Acme Corporation"
 *                     sector: "Teknoloji"
 *                     currency: "EUR"
 *                     balance: 125000.50
 *                     owner_id: "223e4567-e89b-12d3-a456-426614174001"
 *                     created_at: "2024-01-15T10:30:00.000Z"
 *               successWithoutSector:
 *                 summary: Başarılı (sektör bilgisi olmadan)
 *                 value:
 *                   success: true
 *                   message: "Firma bilgileri başarıyla getirildi"
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     company_name: "Sample Ltd."
 *                     sector: null
 *                     currency: "USD"
 *                     balance: 0.00
 *                     owner_id: "223e4567-e89b-12d3-a456-426614174001"
 *                     created_at: "2024-02-20T14:45:00.000Z"
 *       400:
 *         description: Hatalı İstek - Geçersiz veya eksik firma ID
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
 *                   example: "Firma ID gereklidir"
 *             examples:
 *               missingId:
 *                 summary: Firma ID eksik
 *                 value:
 *                   success: false
 *                   message: "Firma ID gereklidir"
 *               invalidId:
 *                 summary: Geçersiz firma ID formatı
 *                 value:
 *                   success: false
 *                   message: "Geçersiz firma ID formatı"
 *       401:
 *         description: Yetkisiz - Token geçersiz veya eksik
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
 *                   example: "Yetkilendirme gerekli"
 *       403:
 *         description: Erişim Engellendi - Kullanıcının firma ayarlarına erişim yetkisi yok
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
 *                   example: "Ayarlar sayfasına erişim yetkiniz yok"
 *             examples:
 *               noPermission:
 *                 summary: Yetkisiz erişim
 *                 value:
 *                   success: false
 *                   message: "Ayarlar sayfasına erişim yetkiniz yok"
 *       404:
 *         description: Bulunamadı - Belirtilen ID'ye sahip firma bulunamadı
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
 *                   example: "Firma bulunamadı"
 *             examples:
 *               notFound:
 *                 summary: Firma bulunamadı
 *                 value:
 *                   success: false
 *                   message: "Firma bulunamadı"
 *       500:
 *         description: Sunucu Hatası - Beklenmeyen bir hata oluştu
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
 *                   example: "Firma bilgileri getirilirken hata oluştu"
 *                 error:
 *                   type: object
 *                   description: Hata detayları (sadece development ortamında)
 */

const express = require('express');
const router = express.Router();
const { queryAsync } = require('../../../database/utils/connection');
const { t } = require('../../../config/i18nConfig');
require('../../../utils/validation');
const { isValidCompanyId } = require("../../../utils/validation");
const responseHelper = require("../../utils/responseHelper");
const { canUserAccessCompanySettings, checkUserRoles} = require('../../../utils/permissionsManager');
const getCompanyTotalBalance = require('../../../database/companies/getCompanyTotalBalance');

router.post('/get', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        const { companyId } = req.body;

        // Firma ID kontrolü
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: t('companies:get.companyIdRequired')
            });
        }

        if ( isValidCompanyId(companyId)) {
            return res.status(400).json({
                success: false,
                message: t('companies:get.invalidCompanyId')
            });
        }

        // Kullanıcının firma ayarlarına erişim yetkisi kontrolü
        const accessCheck = await canUserAccessCompanySettings(userId, companyId);
        if (!accessCheck.canAccess) {
            return res.status(403).json({
                success: false,
                message: accessCheck.message
            });
        }

        // Firma bilgilerini getir
        const query = `
            SELECT 
                id,
                company_name,
                sector,
                currency,
                balance,
                owner_id,
                created_at
            FROM companies
            WHERE id = ?
        `;

        const result = await queryAsync(query, [companyId]);

        // Firma bulunamadı kontrolü
        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: t('companies:get.notFound')
            });
        }

        const hasSensitiveAccess = await checkUserRoles(userId, companyId, [
            'can_transfer_company_to_same_company_user',
            'can_transfer_company_to_other_company_user',
            'can_transfer_company_to_other_company',
            'can_transfer_company_to_external',
            'can_receive_external_to_company',
            'can_view_company_transfer_history',
            'can_view_other_users_transfer_history'
        ]);

        if ( !hasSensitiveAccess ) {
            // Kullanıcının hassas bilgilere erişimi yoksa, bakiye bilgisini gizle
            result[0].balance = undefined;
        }
        else {
            result[0].totalBalance = await getCompanyTotalBalance(companyId);
        }

        // Başarılı sonuç döndür
        return res.status(200).json({
            success: true,
            message: t('companies:get.success'),
            data: result[0]
        });

    } catch (error) {
        console.error('Get company error:', error);

        const statusCode = error.status || 500;
        const message = error.message || t('companies:get.error');

        return res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

module.exports = router;
