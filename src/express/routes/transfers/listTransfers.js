// src/routes/transfers/list.js

/**
 * @swagger
 * ... (Swagger kısmı aynı kalabilir, kısalttım)
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
function resolveAccessScope(initiatorUserId, {userId, toUserId, companyId, toUserCompanyId,}) {
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
    const own = targetsOwnExplicit && !hasUserFilter;

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
    if (own && !otherUsers && !companyWide) {
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
