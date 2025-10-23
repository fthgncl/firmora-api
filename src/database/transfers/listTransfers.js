const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');

/**
 * Transfer kayıtlarını listeler ve sayfalama ile sonuçları döndürür
 * @param {{searchTerm: string, companyId: *, userId: null, toUserId: null, toUserCompanyId: null, transferType: null, status: null, currency: null, fromScope: null, toScope: null, startDate: null, endDate: null, limit: number, offset: number, sortBy: string, sortOrder: string}} options - Arama parametreleri
 * @param {string} options.searchTerm - Aranacak terim (id, açıklama, tutar vb.)
 * @param {string} options.entitySearch - Kullanıcı/Firma ID araması (user_id, company_id, to_user_id, to_user_company_id)
 * @param {string} options.companyId - Firma ID (gönderen firma)
 * @param {string} options.userId - Kullanıcı ID (işlemi yapan kullanıcı)
 * @param {string} options.toUserId - Hedef kullanıcı ID
 * @param {string} options.toUserCompanyId - Hedef firma ID
 * @param {string} options.transferType - Transfer türü filtresi
 * @param {string} options.status - Transfer durumu filtresi
 * @param {string} options.currency - Para birimi filtresi
 * @param {string} options.fromScope - Kaynak scope filtresi
 * @param {string} options.toScope - Hedef scope filtresi
 * @param {string} options.startDate - Başlangıç tarihi (YYYY-MM-DD)
 * @param {string} options.endDate - Bitiş tarihi (YYYY-MM-DD)
 * @param {number} options.limit - Sayfa başına sonuç sayısı (varsayılan: 20)
 * @param {number} options.offset - Atlanacak kayıt sayısı (varsayılan: 0)
 * @param {string} options.sortBy - Sıralama alanı (varsayılan: 'created_at')
 * @param {string} options.sortOrder - Sıralama yönü ('ASC' veya 'DESC', varsayılan: 'DESC')
 * @returns {Promise<Object>} Transfer listesi ve toplam sayı
 */
async function listTransfers(options = {}) {
    try {
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
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Max 100, min 1
        const validOffset = Math.max(parseInt(offset) || 0, 0);
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const validSortFields = ['id', 'amount', 'created_at', 'status', 'transfer_type', 'currency'];
        const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';

        let whereConditions = [];
        let params = [];

        // Arama terimi (id, açıklama, external isimler)
        if (searchTerm && searchTerm.trim() !== '') {
            const trimmed = searchTerm.trim();
            const searchPattern = `%${trimmed}%`;

            const conditions = [
                'transfers.id LIKE ?',
                'transfers.description LIKE ?',
                'transfers.to_external_name LIKE ?',
                'transfers.from_external_name LIKE ?'
            ];

            const paramsList = [searchPattern, searchPattern, searchPattern, searchPattern];

            whereConditions.push(`(${conditions.join(' OR ')})`);
            params.push(...paramsList);
        }

        // Entity ID araması - Temel filtre (user_id, company_id, to_user_id, to_user_company_id)
        // Bu filtre kullanılırsa, önce bu ID'nin bulunduğu tüm kayıtlar getirilir
        // Sonra diğer filtreler bu kayıtlar üzerinde uygulanır
        if (entitySearch && entitySearch.trim() !== '') {
            const trimmed = entitySearch.trim();

            const conditions = [
                'transfers.user_id = ?',
                'transfers.company_id = ?',
                'transfers.to_user_id = ?',
                'transfers.to_user_company_id = ?'
            ];

            const paramsList = [trimmed, trimmed, trimmed, trimmed];

            whereConditions.push(`(${conditions.join(' OR ')})`);
            params.push(...paramsList);
        }

        // Aşağıdaki filtreler entitySearch varsa onun üzerine, yoksa tüm kayıtlar üzerine uygulanır

        // Firma filtresi (gönderen veya alan firma)
        if (companyId) {
            whereConditions.push('(transfers.company_id = ? OR transfers.to_user_company_id = ?)');
            params.push(companyId, companyId);
        }

        // Kullanıcı filtresi (işlemi yapan kullanıcı)
        if (userId) {
            whereConditions.push('transfers.user_id = ?');
            params.push(userId);
        }

        // Hedef kullanıcı filtresi
        if (toUserId) {
            whereConditions.push('transfers.to_user_id = ?');
            params.push(toUserId);
        }

        // Hedef firma filtresi
        if (toUserCompanyId) {
            whereConditions.push('transfers.to_user_company_id = ?');
            params.push(toUserCompanyId);
        }

        // Transfer türü filtresi
        if (transferType) {
            whereConditions.push('transfers.transfer_type = ?');
            params.push(transferType);
        }

        // Durum filtresi
        if (status) {
            whereConditions.push('transfers.status = ?');
            params.push(status);
        }

        // Para birimi filtresi
        if (currency) {
            whereConditions.push('transfers.currency = ?');
            params.push(currency);
        }

        // Kaynak scope filtresi
        if (fromScope) {
            whereConditions.push('transfers.from_scope = ?');
            params.push(fromScope);
        }

        // Hedef scope filtresi
        if (toScope) {
            whereConditions.push('transfers.to_scope = ?');
            params.push(toScope);
        }

        // Tarih aralığı filtresi
        if (startDate) {
            whereConditions.push('transfers.created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('transfers.created_at <= ?');
            params.push(endDate + ' 23:59:59');
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Toplam sayıyı al
        const countQuery = `
            SELECT COUNT(*) as total
            FROM transfers
            ${whereClause}
        `;

        const countResult = await queryAsync(countQuery, params);
        const totalCount = countResult[0]?.total || 0;

        // Transfer kayıtlarını al
        const transfersQuery = `
            SELECT 
                transfers.id,
                transfers.user_id,
                transfers.company_id,
                transfers.to_user_id,
                transfers.to_user_company_id,
                transfers.from_scope,
                transfers.to_scope,
                transfers.amount,
                transfers.currency,
                transfers.description,
                transfers.status,
                transfers.to_external_name,
                transfers.from_external_name,
                transfers.created_at,
                transfers.transfer_type,
                transfers.sender_final_balance,
                transfers.receiver_final_balance,
                sender_user.name AS sender_name,
                sender_user.surname AS sender_surname,
                sender_company.company_name AS sender_company_name,
                receiver_user.name AS receiver_name,
                receiver_user.surname AS receiver_surname,
                receiver_company.company_name AS receiver_company_name
            FROM transfers
            LEFT JOIN users AS sender_user ON transfers.user_id = sender_user.id
            LEFT JOIN companies AS sender_company ON transfers.company_id = sender_company.id
            LEFT JOIN users AS receiver_user ON transfers.to_user_id = receiver_user.id
            LEFT JOIN companies AS receiver_company ON transfers.to_user_company_id = receiver_company.id
            ${whereClause}
            ORDER BY transfers.${validSortBy} ${validSortOrder}
            LIMIT ? OFFSET ?
        `;

        const transfersParams = [...params, validLimit, validOffset];
        const transfers = await queryAsync(transfersQuery, transfersParams);

        const totalPages = Math.ceil(totalCount / validLimit);
        const currentPage = Math.floor(validOffset / validLimit) + 1;

        return {
            status: 200,
            message: t('transfers:list.success'),
            data: {
                transfers: transfers || [],
                pagination: {
                    total: totalCount,
                    limit: validLimit,
                    offset: validOffset,
                    currentPage: currentPage,
                    totalPages: totalPages,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            }
        };

    } catch (error) {
        throw {
            status: error.status || 500,
            message: `${t('transfers:list.failed')} : ${error.message}`,
            error
        };
    }
}

/**
 * Belirli bir firmaya ait transferleri listeler
 * @param {string} companyId - Firma ID
 * @param {Object} options - Arama parametreleri
 * @returns {Promise<Object>} Transfer listesi
 */
async function listTransfersByCompany(companyId, options = {}) {
    if (!companyId) {
        throw {
            status: 400,
            message: t('transfers:list.companyIdRequired')
        };
    }

    return listTransfers({
        ...options,
        companyId
    });
}

/**
 * Belirli bir kullanıcıya ait transferleri listeler
 * @param {string} userId - Kullanıcı ID
 * @param {Object} options - Arama parametreleri
 * @returns {Promise<Object>} Transfer listesi
 */
async function listTransfersByUser(userId, options = {}) {
    if (!userId) {
        throw {
            status: 400,
            message: t('transfers:list.userIdRequired') || 'User ID is required'
        };
    }

    return listTransfers({
        ...options,
        userId
    });
}

module.exports = {
    listTransfers,
    listTransfersByCompany,
    listTransfersByUser
};
