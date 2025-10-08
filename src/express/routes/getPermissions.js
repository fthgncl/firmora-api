const express = require('express');
const router = express.Router();
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18nConfig');
const permissions = require('../../config/permissionsConfig');

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Yetki yapılandırmasını getir
 *     description: |
 *       Sistemdeki tüm yetki tanımlarını getirir.
 *       
 *       ## Kimlik Doğrulama
 *       
 *       Bu endpoint JWT token ile korunmaktadır. İstek yaparken header'da token gönderilmelidir:
 *       
 *       ```
 *       x-access-token: <your_jwt_token>
 *       ```
 *       
 *       ## Dönen Bilgiler
 *       
 *       Her yetki için aşağıdaki bilgiler döndürülür:
 *       
 *       - **code**: Yetki kodu (tek karakter, alfabetik)
 *       - **category**: Yetki kategorisi (system, personnel, financial)
 *       - **name_key**: İsim için i18n çeviri anahtarı
 *       - **description_key**: Açıklama için i18n çeviri anahtarı
 *       
 *       ## Kullanım Senaryoları
 *       
 *       - Yetki yönetimi arayüzü oluşturma
 *       - Kullanıcı yetki atama formu
 *       - Yetki görüntüleme ve düzenleme
 *       - Frontend yetki kontrolü
 *       - Dinamik menü oluşturma
 *       
 *       ## Yetki Kategorileri
 *       
 *       - **system**: Sistem yönetimi yetkileri (örn: sys_admin)
 *       - **personnel**: Personel yönetimi yetkileri (örn: personnel_manager)
 *       - **financial**: Finansal işlem yetkileri (örn: can_transfer_money, can_transfer_external)
 *       
 *       ## Yetki Kodları Nasıl Kullanılır?
 *       
 *       Yetki kodları string olarak birleştirilerek saklanır:
 *       - Kullanıcı sys_admin ve can_transfer_money yetkilerine sahipse: `"ac"`
 *       - Sadece personnel_manager yetkisi varsa: `"b"`
 *       
 *     tags:
 *       - Permissions
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Başarılı - Yetki yapılandırması başarıyla getirildi
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
 *                   properties:
 *                     permissions:
 *                       type: object
 *                       description: Yetki tanımları objesi
 *                       additionalProperties:
 *                         type: object
 *                         required:
 *                           - code
 *                           - category
 *                           - name_key
 *                           - description_key
 *                         properties:
 *                           code:
 *                             type: string
 *                             description: Yetki kodu (tek karakter)
 *                             example: "a"
 *                           category:
 *                             type: string
 *                             description: Yetki kategorisi
 *                             example: "system"
 *                             enum: [system, personnel, financial]
 *                           name_key:
 *                             type: string
 *                             description: İsim için i18n çeviri anahtarı
 *                             example: "permissions.sys_admin.name"
 *                           description_key:
 *                             type: string
 *                             description: Açıklama için i18n çeviri anahtarı
 *                             example: "permissions.sys_admin.description"
 *             examples:
 *               success:
 *                 summary: Başarılı yanıt
 *                 value:
 *                   success: true
 *                   data:
 *                     permissions:
 *                       sys_admin:
 *                         code: "a"
 *                         category: "system"
 *                         name_key: "permissions.sys_admin.name"
 *                         description_key: "permissions.sys_admin.description"
 *                       personnel_manager:
 *                         code: "b"
 *                         category: "personnel"
 *                         name_key: "permissions.personnel_manager.name"
 *                         description_key: "permissions.personnel_manager.description"
 *                       can_transfer_money:
 *                         code: "c"
 *                         category: "financial"
 *                         name_key: "permissions.can_transfer_money.name"
 *                         description_key: "permissions.can_transfer_money.description"
 *                       can_transfer_external:
 *                         code: "d"
 *                         category: "financial"
 *                         name_key: "permissions.can_transfer_external.name"
 *                         description_key: "permissions.can_transfer_external.description"
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
 *             examples:
 *               noToken:
 *                 summary: Token eksik
 *                 description: x-access-token header'ında JWT token bulunamadı
 *                 value:
 *                   success: false
 *                   message: "Yetkilendirme gerekli"
 *               invalidToken:
 *                 summary: Geçersiz token
 *                 description: Token formatı hatalı veya süresi dolmuş
 *                 value:
 *                   success: false
 *                   message: "Geçersiz veya süresi dolmuş token"
 *               expiredToken:
 *                 summary: Token süresi dolmuş
 *                 description: Token'ın geçerlilik süresi sona ermiş
 *                 value:
 *                   success: false
 *                   message: "Token süresi dolmuş, lütfen yeniden giriş yapın"
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
 *                   example: "Yetki yapılandırması getirilirken hata oluştu"
 */
router.get('/', async (req, res) => {
    try {
        // Token kontrolü middleware tarafından yapılıyor
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        // Permissions config'i döndür
        return responseHelper.success(res, {
            permissions: permissions(req.language)
        });

    } catch (error) {
        console.error('Yetki yapılandırması getirme hatası:', error);
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
