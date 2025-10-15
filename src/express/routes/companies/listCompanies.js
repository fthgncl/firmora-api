const express = require('express');
const router = express.Router();
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');
const { queryAsync } = require('../../../database/utils/connection');
const { readUserPermissions } = require('../../../utils/permissionsManager');
const permissions = require('../../../config/permissionsConfig');

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Kullanıcının şirketlerini listele
 *     description: |
 *       Giriş yapmış kullanıcının erişebildiği tüm şirketleri listeler.
 *       
 *       ## Listelenen Şirketler
 *       
 *       Aşağıdaki kriterlere uyan şirketler listelenir:
 *       
 *       - Kullanıcının sahip olduğu şirketler
 *       - Kullanıcının `sys_admin` yetkisine sahip olduğu şirketler
 *       - Kullanıcının `personnel_manager` yetkisine sahip olduğu şirketler
 *       
 *       ## Dönen Bilgiler
 *       
 *       Her şirket için aşağıdaki bilgiler döndürülür:
 *       
 *       - Şirket ID ve adı
 *       - Sektör bilgisi
 *       - Para birimi
 *       - Güncel bakiye
 *       - Şirket sahibi ID
 *       - Oluşturulma tarihi
 *       
 *       ## Kullanım Senaryoları
 *       
 *       - Ana sayfa şirket listesi
 *       - Şirket seçim dropdown'ı
 *       - Dashboard şirket geçişi
 *       - Kullanıcı erişim yönetimi
 *       
 *     tags:
 *       - Companies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı - Şirketler başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: İşlem başarı durumu
 *                   example: true
 *                 data:
 *                   type: object
 *                   required:
 *                     - companies
 *                   properties:
 *                     companies:
 *                       type: array
 *                       description: Kullanıcının erişebildiği şirketler listesi
 *                       items:
 *                         type: object
 *                         required:
 *                           - id
 *                           - company_name
 *                           - currency
 *                           - balance
 *                           - owner_id
 *                           - created_at
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Şirket ID
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           company_name:
 *                             type: string
 *                             minLength: 2
 *                             maxLength: 50
 *                             description: Şirket adı
 *                             example: "Acme Corporation"
 *                           sector:
 *                             type: string
 *                             maxLength: 50
 *                             nullable: true
 *                             description: Şirket sektörü (opsiyonel)
 *                             example: "Teknoloji"
 *                           currency:
 *                             type: string
 *                             pattern: '^[A-Z]{3}$'
 *                             description: Para birimi (ISO 4217)
 *                             example: "EUR"
 *                             enum: [EUR, USD, TRY, GBP]
 *                           balance:
 *                             type: number
 *                             format: decimal
 *                             description: Şirket bakiyesi
 *                             example: 125000.50
 *                           owner_id:
 *                             type: string
 *                             format: uuid
 *                             description: Şirket sahibi kullanıcı ID
 *                             example: "223e4567-e89b-12d3-a456-426614174001"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Şirket oluşturulma tarihi
 *                             example: "2024-01-15T10:30:00.000Z"
 *             examples:
 *               multipleCompanies:
 *                 summary: Birden fazla şirket
 *                 value:
 *                   success: true
 *                   data:
 *                     companies:
 *                       - id: "123e4567-e89b-12d3-a456-426614174000"
 *                         company_name: "Acme Corporation"
 *                         sector: "Teknoloji"
 *                         currency: "EUR"
 *                         balance: 125000.50
 *                         owner_id: "223e4567-e89b-12d3-a456-426614174001"
 *                         created_at: "2024-01-15T10:30:00.000Z"
 *                       - id: "223e4567-e89b-12d3-a456-426614174002"
 *                         company_name: "Tech Solutions"
 *                         sector: "Yazılım"
 *                         currency: "USD"
 *                         balance: 50000.00
 *                         owner_id: "323e4567-e89b-12d3-a456-426614174003"
 *                         created_at: "2024-02-20T14:45:00.000Z"
 *               emptyList:
 *                 summary: Şirket bulunamadı
 *                 value:
 *                   success: true
 *                   data:
 *                     companies: []
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
 *                   example: "Şirketleri listelerken hata oluştu"
 *                 error:
 *                   type: object
 *                   description: Hata detayları (sadece development ortamında)
 */
router.get('/', async (req, res) => {
    try {
        // Kullanıcı ID'sini al
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        // Kullanıcının sys_admin veya personnel_manager yetkisine sahip olduğu şirketleri getir
        const userPermissionsData = await readUserPermissions(userId);
        const authorizedCompanyIds = [];

        // sys_admin ve personnel_manager kodlarını al
        const sysAdminCode = permissions.sys_admin?.code;
        const personnelManagerCode = permissions.personnel_manager?.code;

        // Yetkileri kontrol et ve uygun şirket ID'lerini topla
        if (userPermissionsData.permissions && Array.isArray(userPermissionsData.permissions)) {
            for (const perm of userPermissionsData.permissions) {
                const permString = perm.permissions || '';
                if (permString.includes(sysAdminCode) || permString.includes(personnelManagerCode)) {
                    authorizedCompanyIds.push(perm.companyId);
                }
            }
        }

        // Yetkili olunan şirketlerin detaylarını getir
        let authorizedCompanies = [];
        if (authorizedCompanyIds.length > 0) {
            const placeholders = authorizedCompanyIds.map(() => '?').join(',');
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
                WHERE id IN (${placeholders})
            `;
            authorizedCompanies = await queryAsync(query, authorizedCompanyIds);
        }

        // İki listeyi birleştir ve duplicate'leri temizle
        const companyMap = new Map();

        // Yetkili olunan şirketleri ekle (duplicate'ler otomatik olarak üzerine yazılır)
        authorizedCompanies.forEach(company => {
            companyMap.set(company.id, company);
        });

        // Map'i array'e çevir
        const allCompanies = Array.from(companyMap.values());

        return responseHelper.success(res, {
            companies: allCompanies
        });

    } catch (error) {
        console.error('Şirketleri listeleme hatası:', error);
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
