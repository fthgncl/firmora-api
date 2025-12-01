/**
 * @swagger
 * /search-users:
 *   post:
 *     summary: Gelişmiş kullanıcı arama
 *     description: |
 *       Kullanıcıları yetkilerine göre arar ve filtreler. Sayfalama, sıralama ve gelişmiş arama özellikleri sunar.
 *
 *       ## Yetki Seviyeleri
 *
 *       Kullanıcılar aşağıdaki durumlarda **tüm kullanıcılara** erişebilir:
 *       - Firma sahibi ise
 *       - `personnel_manager` (Personel Yöneticisi) yetkisine sahipse
 *       - `can_transfer_external` (Firma Dışı Transfer) yetkisine sahipse
 *
 *       Diğer durumlarda kullanıcılar **sadece kendi firmalarındaki** kullanıcıları görebilir.
 *
 *       ## Arama Özellikleri
 *
 *       - İsim, soyisim, email, telefon ve username alanlarında arama
 *       - Esnek sayfalama (limit & offset)
 *       - Çoklu alan sıralaması (ASC/DESC)
 *       - Detaylı pagination bilgileri
 *       - LIKE operatörü ile esnek eşleşme
 *
 *       ## Neden POST?
 *
 *       Bu endpoint arama işlemi olmasına rağmen POST metodu kullanır çünkü:
 *
 *       **Avantajlar:**
 *       - ✅ Karmaşık arama kriterleri için ideal
 *       - ✅ URL uzunluk limitinden etkilenmez
 *       - ✅ JSON formatında zengin veri yapısı
 *       - ✅ Requst body ile güvenli parametre iletimi
 *       - ✅ Tüm HTTP istemcileri tarafından desteklenir
 *       - ✅ Gelecekte filtre ekleme kolaylığı
 *
 *       **Kullanım Senaryoları:**
 *       - Yeni personel eklerken kullanıcı seçimi
 *       - Para transferi için alıcı arama
 *       - Raporlama ve analitik için kullanıcı filtreleme
 *       - Admin panelinde kullanıcı yönetimi
 *
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Arama kriterleri ve sayfalama parametreleri
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
 *                   Firma ID (zorunlu)
 *
 *                   Bu parametre kullanıcının hangi firma bağlamında arama yaptığını belirtir.
 *                   Yetki kontrolü bu firma üzerinden yapılır.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               searchTerm:
 *                 type: string
 *                 minLength: 0
 *                 maxLength: 100
 *                 description: |
 *                   Arama terimi (opsiyonel)
 *
 *                   Aşağıdaki alanlarda arama yapar:
 *                   - İsim (name)
 *                   - Soyisim (surname)
 *                   - E-posta (email)
 *                   - Telefon (phone)
 *                   - Kullanıcı adı (username)
 *
 *                   Boş bırakılırsa tüm kullanıcılar listelenir.
 *                 example: "ahmet"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 description: |
 *                   Sayfa başına sonuç sayısı
 *
 *                   - Minimum: 1
 *                   - Maksimum: 100
 *                   - Varsayılan: 20
 *                 example: 20
 *               offset:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: |
 *                   Atlanacak kayıt sayısı (sayfalama için)
 *
 *                   Örnek:
 *                   - 1. sayfa için: offset = 0
 *                   - 2. sayfa için: offset = 20 (limit=20 ise)
 *                   - 3. sayfa için: offset = 40 (limit=20 ise)
 *                 example: 0
 *               sortBy:
 *                 type: string
 *                 enum: [name, surname, email, phone, username, created_at]
 *                 default: name
 *                 description: |
 *                   Sıralama yapılacak alan
 *
 *                   Kullanılabilir alanlar:
 *                   - `name`: İsim
 *                   - `surname`: Soyisim
 *                   - `email`: E-posta
 *                   - `phone`: Telefon
 *                   - `username`: Kullanıcı adı
 *                   - `created_at`: Kayıt tarihi
 *                 example: "name"
 *               sortOrder:
 *                 type: string
 *                 enum: [ASC, DESC]
 *                 default: ASC
 *                 description: |
 *                   Sıralama yönü
 *
 *                   - `ASC`: Artan sıralama (A-Z, 0-9, eski-yeni)
 *                   - `DESC`: Azalan sıralama (Z-A, 9-0, yeni-eski)
 *                 example: "ASC"
 *           examples:
 *             basicSearch:
 *               summary: Basit arama
 *               description: Tüm kullanıcıları varsayılan ayarlarla listele
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *             nameSearch:
 *               summary: İsimle arama
 *               description: Belirli bir ismi içeren kullanıcıları ara
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                 searchTerm: "ahmet"
 *                 limit: 10
 *                 offset: 0
 *                 sortBy: "name"
 *                 sortOrder: "ASC"
 *             paginatedSearch:
 *               summary: Sayfalı arama
 *               description: İkinci sayfayı getir (her sayfada 20 kayıt)
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                 searchTerm: ""
 *                 limit: 20
 *                 offset: 20
 *                 sortBy: "created_at"
 *                 sortOrder: "DESC"
 *             emailSearch:
 *               summary: E-posta ile arama
 *               description: E-posta adresi içeren kullanıcıları ara
 *               value:
 *                 companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                 searchTerm: "@example.com"
 *                 limit: 50
 *                 offset: 0
 *                 sortBy: "email"
 *                 sortOrder: "ASC"
 *     responses:
 *       200:
 *         description: Başarılı - Kullanıcılar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *                 - searchScope
 *                 - reason
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: İşlem başarı durumu
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: İşlem sonucu mesajı
 *                   example: "Kullanıcılar başarıyla getirildi"
 *                 data:
 *                   type: object
 *                   required:
 *                     - users
 *                     - pagination
 *                   properties:
 *                     users:
 *                       type: array
 *                       description: Bulunan kullanıcılar listesi
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: Kullanıcı ID
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           name:
 *                             type: string
 *                             description: Kullanıcı adı
 *                             example: "Ahmet"
 *                           surname:
 *                             type: string
 *                             description: Kullanıcı soyadı
 *                             example: "Yılmaz"
 *                           email:
 *                             type: string
 *                             format: email
 *                             description: E-posta adresi
 *                             example: "ahmet.yilmaz@example.com"
 *                           phone:
 *                             type: string
 *                             description: Telefon numarası
 *                             example: "+905551234567"
 *                           username:
 *                             type: string
 *                             description: Kullanıcı adı (username)
 *                             example: "ahmetyilmaz"
 *                           emailverified:
 *                             type: boolean
 *                             description: E-posta doğrulama durumu
 *                             example: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Kayıt oluşturma tarihi
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           permissions:
 *                             type: array
 *                             description: Kullanıcının tüm firmalardaki yetki kodları
 *                             items:
 *                               type: object
 *                               properties:
 *                                 companyId:
 *                                   type: string
 *                                   format: uuid
 *                                   description: Firma ID
 *                                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                                 permissions:
 *                                   type: string
 *                                   description: Yetki kodları (örn. "abc" - a, b, c yetkileri)
 *                                   example: "abc"
 *                             example:
 *                               - companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                                 permissions: "abc"
 *                               - companyId: "223e4567-e89b-12d3-a456-426614174001"
 *                                 permissions: "de"
 *                     pagination:
 *                       type: object
 *                       description: Sayfalama bilgileri
 *                       required:
 *                         - total
 *                         - limit
 *                         - offset
 *                         - currentPage
 *                         - totalPages
 *                         - hasNextPage
 *                         - hasPrevPage
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Toplam kullanıcı sayısı
 *                           example: 150
 *                         limit:
 *                           type: integer
 *                           description: Sayfa başına gösterilen kayıt sayısı
 *                           example: 20
 *                         offset:
 *                           type: integer
 *                           description: Atlanan kayıt sayısı
 *                           example: 0
 *                         currentPage:
 *                           type: integer
 *                           description: Mevcut sayfa numarası
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           description: Toplam sayfa sayısı
 *                           example: 8
 *                         hasNextPage:
 *                           type: boolean
 *                           description: Sonraki sayfa var mı?
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           description: Önceki sayfa var mı?
 *                           example: false
 *                 searchScope:
 *                   type: string
 *                   enum: [all, company, none]
 *                   description: |
 *                     Kullanıcının arama kapsamı
 *
 *                     - `all`: Tüm kullanıcılara erişebilir
 *                     - `company`: Sadece firma içi kullanıcılara erişebilir
 *                     - `none`: Hiçbir kullanıcıya erişemez
 *                   example: "all"
 *                 reason:
 *                   type: string
 *                   description: |
 *                     Arama yetkisinin verilme nedeni
 *
 *                     Olası değerler:
 *                     - `owner`: Firma sahibi
 *                     - `personnel_manager`: Personel yöneticisi yetkisi
 *                     - `can_transfer_external`: Firma dışı transfer yetkisi
 *                     - `has_search_permission`: Genel arama yetkisi
 *                     - `default`: Varsayılan firma içi erişim
 *                   example: "owner"
 *             examples:
 *               successWithResults:
 *                 summary: Başarılı arama (sonuçlar var)
 *                 value:
 *                   success: true
 *                   message: "Kullanıcılar başarıyla getirildi"
 *                   data:
 *                     users:
 *                       - id: "123e4567-e89b-12d3-a456-426614174000"
 *                         name: "Ahmet"
 *                         surname: "Yılmaz"
 *                         email: "ahmet.yilmaz@example.com"
 *                         phone: "+905551234567"
 *                         username: "ahmetyilmaz"
 *                         emailverified: true
 *                         created_at: "2024-01-15T10:30:00.000Z"
 *                         permissions:
 *                           - companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                             permissions: "abc"
 *                           - companyId: "223e4567-e89b-12d3-a456-426614174001"
 *                             permissions: "de"
 *                       - id: "223e4567-e89b-12d3-a456-426614174001"
 *                         name: "Mehmet"
 *                         surname: "Demir"
 *                         email: "mehmet.demir@example.com"
 *                         phone: "+905551234568"
 *                         username: "mehmetdemir"
 *                         emailverified: false
 *                         created_at: "2024-01-16T11:30:00.000Z"
 *                         permissions:
 *                           - companyId: "123e4567-e89b-12d3-a456-426614174000"
 *                             permissions: "f"
 *                     pagination:
 *                       total: 150
 *                       limit: 20
 *                       offset: 0
 *                       currentPage: 1
 *                       totalPages: 8
 *                       hasNextPage: true
 *                       hasPrevPage: false
 *                   searchScope: "all"
 *                   reason: "owner"
 *               successNoResults:
 *                 summary: Başarılı arama (sonuç yok)
 *                 value:
 *                   success: true
 *                   message: "Kullanıcılar başarıyla getirildi"
 *                   data:
 *                     users: []
 *                     pagination:
 *                       total: 0
 *                       limit: 20
 *                       offset: 0
 *                       currentPage: 1
 *                       totalPages: 0
 *                       hasNextPage: false
 *                       hasPrevPage: false
 *                   searchScope: "company"
 *                   reason: "default"
 *       400:
 *         description: Hatalı İstek - Geçersiz veya eksik parametreler
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
 *               missingCompanyId:
 *                 summary: Firma ID eksik
 *                 value:
 *                   success: false
 *                   message: "Firma ID gereklidir"
 *               invalidLimit:
 *                 summary: Geçersiz limit değeri
 *                 value:
 *                   success: false
 *                   message: "Limit değeri 1-100 arasında olmalıdır"
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
 *                 value:
 *                   success: false
 *                   message: "Yetkilendirme gerekli"
 *               invalidToken:
 *                 summary: Geçersiz token
 *                 value:
 *                   success: false
 *                   message: "Geçersiz token"
 *       403:
 *         description: Yasak - Kullanıcı arama yetkisi yok
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
 *                   example: "Kullanıcı arama yetkisi yok"
 *             examples:
 *               noPermission:
 *                 summary: Arama yetkisi yok
 *                 value:
 *                   success: false
 *                   message: "Kullanıcı arama yetkisi yok"
 *               companyNotFound:
 *                 summary: Firma bulunamadı
 *                 value:
 *                   success: false
 *                   message: "Belirtilen firmaya erişim yetkiniz yok"
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
 *                   example: "Kullanıcı arama sırasında hata oluştu"
 *                 error:
 *                   type: object
 *                   description: Hata detayları (sadece development ortamında görünür)
 *             examples:
 *               databaseError:
 *                 summary: Veritabanı hatası
 *                 value:
 *                   success: false
 *                   message: "Veritabanı bağlantı hatası"
 *               generalError:
 *                 summary: Genel hata
 *                 value:
 *                   success: false
 *                   message: "Kullanıcı arama sırasında hata oluştu"
 */

const express = require('express');
const router = express.Router();
const { canUserSearchUsers, checkUserRoles} = require('../../utils/permissionsManager');
const { searchAllUsers, searchUsersInCompany } = require('../../database/users/searchUsers');
const { t } = require('../../config/i18n.config');
const {getAccountsByUserId} = require("../../database/accounts");

router.post('/', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {
            searchTerm = '',
            companyId,
            limit = 20,
            offset = 0,
            sortBy = 'name',
            sortOrder = 'ASC',
            searchScope = 'all'
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: t('errors:general.unauthorized')
            });
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: t('users:search.companyIdRequired')
            });
        }

        const searchPermission = await canUserSearchUsers(userId, companyId);

        if (!searchPermission.canSearch) {
            return res.status(403).json({
                success: false,
                message: t('users:search.noPermission')
            });
        }

        const searchOptions = {
            searchTerm,
            limit: parseInt(limit),
            offset: parseInt(offset),
            sortBy,
            sortOrder: sortOrder.toUpperCase()
        };

        let result;

        if (searchPermission.searchScope === 'all' && searchScope === 'all') {
            result = await searchAllUsers(searchOptions);
        } else if (searchPermission.searchScope === 'company' || searchScope === 'company') {
            result = await searchUsersInCompany(companyId, searchOptions);
        } else {
            return res.status(403).json({
                success: false,
                message: t('users:search.noPermission')
            });
        }

        result.data.users = await Promise.all(
            result.data.users.map(async user => {
                const additionalData = {};
                if (await checkUserRoles(userId, companyId, ['can_view_other_users_transfer_history'])) {
                    const { accounts } = await getAccountsByUserId(user.id, ['balance','currency'], companyId);
                    additionalData.balance = accounts[0]?.balance || 0;
                    additionalData.currency = accounts[0]?.currency || null;
                }

                if (!await checkUserRoles(userId, companyId, ['personnel_manager'])) {
                    delete user.permissions;
                }

                return { ...user, ...additionalData };
            })
        );




        if (await checkUserRoles(userId, companyId, ['can_view_other_users_transfer_history'])) {
            result.data.users = await Promise.all(
                result.data.users.map(async user => {
                    const { accounts } = await getAccountsByUserId(user.id, ['balance','currency'], companyId);
                    const balance = accounts[0]?.balance || 0;
                    const currency = accounts[0]?.currency || null;
                    return { ...user, balance, currency };
                })
            );
        }

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
            searchScope: searchPermission.searchScope,
            reason: searchPermission.reason
        });

    } catch (error) {
        console.log(error)
        const statusCode = error.status || 500;
        const message = error.message || t('users:search.error');

        return res.status(statusCode).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

module.exports = router;

