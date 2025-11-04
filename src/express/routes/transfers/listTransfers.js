// src/routes/transfers/list.js

/**
 * @swagger
 * /transfers/list:
 *   post:
 *     summary: Transfer geçmişini listele
 *     description: |
 *       Belirtilen kriterlere göre transfer geçmişini listeler.
 *       Kullanıcı yetkilendirmesine göre kendi geçmişini, diğer kullanıcıların geçmişini veya firma geneli geçmişi görüntüleyebilir.
 *       
 *       Yetki Kapsamları:
 *       - **Own (Kendi)**: Kullanıcı kendi transfer geçmişini her zaman görüntüleyebilir
 *       - **Other Users**: Diğer kullanıcıların geçmişini görüntülemek için `can_view_other_users_transfer_history` yetkisi gerekir
 *       - **Company Wide**: Firma geneli geçmişi görüntülemek için `can_view_company_transfer_history` yetkisi gerekir
 *     tags:
 *       - Transfers
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
 *               searchTerm:
 *                 type: string
 *                 description: Genel arama terimi (açıklama, notlar vb. içinde aranır)
 *                 example: ""
 *               entitySearch:
 *                 type: string
 *                 description: Varlık bazlı arama (kullanıcı ID, firma ID vb.)
 *                 example: ""
 *               companyId:
 *                 type: integer
 *                 description: Gönderici firma ID (zorunlu)
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 nullable: true
 *                 description: Gönderici kullanıcı ID (filtreleme için)
 *                 example: null
 *               toUserId:
 *                 type: integer
 *                 nullable: true
 *                 description: Alıcı kullanıcı ID (filtreleme için)
 *                 example: null
 *               toUserCompanyId:
 *                 type: integer
 *                 nullable: true
 *                 description: Alıcı firma ID (filtreleme için)
 *                 example: null
 *               transferType:
 *                 type: string
 *                 nullable: true
 *                 description: Transfer tipi (örn. "internal", "external", "company")
 *                 enum: [internal, external, company]
 *                 example: null
 *               status:
 *                 type: string
 *                 nullable: true
 *                 description: Transfer durumu (örn. "pending", "completed", "cancelled")
 *                 enum: [pending, completed, cancelled, failed]
 *                 example: null
 *               currency:
 *                 type: string
 *                 nullable: true
 *                 description: Para birimi kodu (örn. "TRY", "USD", "EUR")
 *                 example: null
 *               fromScope:
 *                 type: string
 *                 nullable: true
 *                 description: Gönderici kapsam (örn. "user", "company")
 *                 enum: [user, company]
 *                 example: null
 *               toScope:
 *                 type: string
 *                 nullable: true
 *                 description: Alıcı kapsam (örn. "user", "company")
 *                 enum: [user, company]
 *                 example: null
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Başlangıç tarihi (ISO 8601 formatında)
 *                 example: null
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Bitiş tarihi (ISO 8601 formatında)
 *                 example: null
 *               limit:
 *                 type: integer
 *                 description: Sayfa başına kayıt sayısı
 *                 default: 20
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 20
 *               offset:
 *                 type: integer
 *                 description: Kaç kayıt atlanacağı (page ile birlikte kullanılmaz)
 *                 default: 0
 *                 minimum: 0
 *                 example: 0
 *               page:
 *                 type: integer
 *                 description: Sayfa numarası (offset yerine kullanılabilir, 1'den başlar)
 *                 minimum: 1
 *                 example: 1
 *               sortBy:
 *                 type: string
 *                 description: Sıralama yapılacak alan
 *                 default: created_at
 *                 enum: [created_at, updated_at, amount, status, transfer_type]
 *                 example: created_at
 *               sortOrder:
 *                 type: string
 *                 description: Sıralama yönü
 *                 default: DESC
 *                 enum: [ASC, DESC]
 *                 example: DESC
 *     responses:
 *       200:
 *         description: Transfer listesi başarıyla getirildi
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
 *                   example: "Transferler başarıyla listelendi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transfers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Transfer ID
 *                           from_user_id:
 *                             type: integer
 *                             description: Gönderici kullanıcı ID
 *                           to_user_id:
 *                             type: integer
 *                             description: Alıcı kullanıcı ID
 *                           from_company_id:
 *                             type: integer
 *                             description: Gönderici firma ID
 *                           to_company_id:
 *                             type: integer
 *                             description: Alıcı firma ID
 *                           amount:
 *                             type: number
 *                             format: decimal
 *                             description: Transfer tutarı
 *                           currency:
 *                             type: string
 *                             description: Para birimi
 *                           transfer_type:
 *                             type: string
 *                             description: Transfer tipi
 *                           status:
 *                             type: string
 *                             description: Transfer durumu
 *                           from_scope:
 *                             type: string
 *                             description: Gönderici kapsam
 *                           to_scope:
 *                             type: string
 *                             description: Alıcı kapsam
 *                           description:
 *                             type: string
 *                             description: Transfer açıklaması
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Oluşturulma tarihi
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             description: Güncellenme tarihi
 *                     total:
 *                       type: integer
 *                       description: Toplam kayıt sayısı
 *                     limit:
 *                       type: integer
 *                       description: Sayfa başına kayıt sayısı
 *                     offset:
 *                       type: integer
 *                       description: Atlanan kayıt sayısı
 *       400:
 *         description: Geçersiz istek parametreleri
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
 *                   example: "Firma ID zorunludur"
 *       401:
 *         description: Kimlik doğrulama hatası
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
 *                   example: "Token eksik veya geçersiz"
 *       403:
 *         description: Yetkisiz erişim
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
 *                   example: "Diğer kullanıcıların transfer geçmişini görüntüleme yetkiniz yok"
 *       500:
 *         description: Sunucu hatası
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
 *                   example: "Sunucu hatası"
 *                 error:
 *                   type: string
 *                   description: Hata detayları
 */

const express = require('express');
const router = express.Router();
const {listTransfers} = require('../../../database/transfers/listTransfers');
const {t} = require('../../../config/i18nConfig');
const responseHelper = require('../../utils/responseHelper');
const {checkUserRoles} = require('../../../utils/permissionsManager');

/**
 * Basit yardımcılar
 */
const isNonEmpty = v => v !== null && v !== undefined && `${v}`.trim() !== '';

/**
 * İsteğin kapsamını analiz eder
 * - own: yalnızca giriş yapan kullanıcının geçmişi hedefleniyor mu?
 * - otherUsers: başka bir kullanıcının geçmişi hedefleniyor mu?
 * - companyWide: kullanıcı filtresi olmadan firma geneli mi isteniyor?
 */
function resolveAccessScope(initiatorUserId, {userId, toUserId, companyId, toUserCompanyId, entitySearch}) {
    // Kullanıcı filtreleri set mi?
    const hasUserFilter =
        (isNonEmpty(userId) && userId !== initiatorUserId) ||
        (isNonEmpty(toUserId) && toUserId !== initiatorUserId) ||
        // entitySearch bir kullanıcı id’si de olabilir; burada kesin bilemeyiz ama
        // en katı yaklaşımı seçelim: initiator’dan farklı ve kullanıcı formatında ise "otherUsers" sayalım.
        false;

    const targetsOwnExplicit =
        (isNonEmpty(userId) && userId === initiatorUserId) ||
        (isNonEmpty(toUserId) && toUserId === initiatorUserId) ||
        // hiçbir kullanıcı filtresi yoksa ama başka filtreler varsa bu tek başına "own" değildir
        false;

    // Firma geneli: herhangi bir kullanıcı id’si belirtmeden (userId/toUserId yok)
    // bir firma özelinde veya iki firma arasında arama isteniyorsa.
    const companyWide =
        !isNonEmpty(userId) &&
        !isNonEmpty(toUserId) &&
        // companyId zaten zorunlu; companyId ile birlikte geniş kapsamlı filtreler varsa
        // bunu firma geneli olarak ele alıyoruz.
        true;

    // own: yalnızca kendi geçmişi hedefleniyor (explicit veya implicit)
    const own = initiatorUserId === entitySearch || (targetsOwnExplicit && !hasUserFilter);

    // otherUsers: başkalarının geçmişi hedefleniyor
    const otherUsers = hasUserFilter;

    return {
        own,
        otherUsers,
        companyWide,
        // Hangi firmalar hedefleniyor? (yetkileri ayrı ayrı kontrol edeceğiz)
        senderCompanyId: companyId || null,
        receiverCompanyId: isNonEmpty(toUserCompanyId) ? toUserCompanyId : null
    };
}

/**
 * Yetkileri kontrol eder.
 * Gerekirse 403 fırlatır.
 * Ayrıca gerekmediği yerlerde talebi "own" kapsamına indirger.
 */
async function authorizeAndNormalizeFilters(initiatorUserId, body) {
    const {
        companyId,
        toUserCompanyId,
        userId,
        toUserId
    } = body;

    const {
        own,
        otherUsers,
        companyWide,
        senderCompanyId,
        receiverCompanyId
    } = resolveAccessScope(initiatorUserId, body);

    // 1) Kendi geçmişi her zaman serbest
    if (own && !otherUsers) {
        return body; // değişiklik yok
    }

    // 2) Diğer kullanıcıların geçmişi isteniyorsa:
    if (otherUsers) {
        // Hangi firmalarda diğer kullanıcı geçmişi isteniyor?
        // Gönderici firma:
        const needsSenderSide =
            isNonEmpty(userId) || isNonEmpty(companyId); // companyId zaten zorunlu, kullanıcı başka ise bu firmada yetki ister
        // Alıcı firma:
        const needsReceiverSide =
            isNonEmpty(toUserId) || isNonEmpty(toUserCompanyId);

        // İlgili firmalarda yetki var mı?
        if (needsSenderSide && isNonEmpty(senderCompanyId)) {
            const canViewSenderUsersTransfers = await checkUserRoles(
                initiatorUserId,
                senderCompanyId,
                ['can_view_other_users_transfer_history']
            );
            if (!canViewSenderUsersTransfers) {
                throw {
                    status: 403,
                    message: t('errors:permissions.cannotViewOtherUserTransferHistory')
                };
            }
        }

        if (needsReceiverSide && isNonEmpty(receiverCompanyId)) {
            const canViewReceiverUsersTransfers = await checkUserRoles(
                initiatorUserId,
                receiverCompanyId,
                ['can_view_other_users_transfer_history']
            );
            if (!canViewReceiverUsersTransfers) {
                throw {
                    status: 403,
                    message: t('errors:permissions.cannotViewOtherUserTransferHistory')
                };
            }
        }

        return body; // yetkiler tamamsa doğrudan izin
    }

    // 3) Firma geneli isteniyorsa (user filtresi olmadan):
    if (companyWide) {
        // Gönderici firma için yetki
        if (isNonEmpty(senderCompanyId)) {
            const canViewSenderCompanyTransfers = await checkUserRoles(
                initiatorUserId,
                senderCompanyId,
                ['can_view_company_transfer_history']
            );
            if (!canViewSenderCompanyTransfers) {
                throw {
                    status: 403,
                    message: t('errors:permissions.cannotViewCompanyTransferHistory')
                };
            }
        }

        // Alıcı firma da hedeflenmişse onun için de yetki
        if (isNonEmpty(receiverCompanyId)) {
            const canViewReceiverCompanyTransfers = await checkUserRoles(
                initiatorUserId,
                receiverCompanyId,
                ['can_view_company_transfer_history']
            );
            if (!canViewReceiverCompanyTransfers) {
                throw {
                    status: 403,
                    message: t('errors:permissions.cannotViewCompanyTransferHistory')
                };
            }
        }

        return body;
    }

    // 4) Belirsiz durum: güvenli tarafta kal → kendi geçmişine indir
    return {
        ...body,
        userId: initiatorUserId,
        toUserId: initiatorUserId
    };
}

router.post('/list', async (req, res) => {
    try {
        const initiatorUserId = req.tokenPayload?.id;
        if (!initiatorUserId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        const {
            searchTerm = '',
            entitySearch = '',
            companyId = null,
            userId = null,
            toUserId = null,
            toUserCompanyId = null,
            transferType = null,
            status = null,
            currency = null,
            fromScope = null,
            toScope = null,
            startDate = null,
            endDate = null,
            limit = 20,
            offset = 0,
            page = 0,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.body;

        if (!companyId)
            return responseHelper.error(res, t('transfers:list.companyIdRequired'), 400);

        // Offset (page parametresi verilmişse)
        let calculatedOffset = offset;
        if (page && !offset) {
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit) || 20;
            calculatedOffset = (pageNum - 1) * limitNum;
        }

        // --- YETKİ KONTROLÜ + GEREKİRSE FİLTRE NORMALİZASYONU ---
        const normalizedBody = await authorizeAndNormalizeFilters(initiatorUserId, {
            searchTerm,
            entitySearch,
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
            endDate
        });

        // Arama seçenekleri
        const searchOptions = {
            ...normalizedBody,
            limit,
            offset: calculatedOffset,
            sortBy,
            sortOrder
        };

        // Transferleri getir
        const result = await listTransfers(searchOptions);

        return responseHelper.success(res, {
            message: result.message,
            data: result.data
        });

    } catch (error) {
        if (error.status && error.status !== 500) {
            return responseHelper.error(
                res,
                `${t('transfers:list.failed')} : ${error.message}`,
                error.status
            );
        }
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
