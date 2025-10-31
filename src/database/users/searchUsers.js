const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');
const { readUserPermissions } = require('../../utils/permissionsManager');
const getAccountsByUserId = require('../accounts/getAccountsByUserId');

/**
 * Kullanıcıları arar ve sayfalama ile sonuçları döndürür
 * @param {Object} options - Arama parametreleri
 * @param {string} options.searchTerm - Aranacak terim (id, isim, email, telefon, username)
 * @param {string} options.companyId - Firma ID (firma bazlı arama için)
 * @param {number} options.limit - Sayfa başına sonuç sayısı (varsayılan: 20)
 * @param {number} options.offset - Atlanacak kayıt sayısı (varsayılan: 0)
 * @param {string} options.searchScope - Arama kapsamı ('all' veya 'company')
 * @param {string} options.sortBy - Sıralama alanı (varsayılan: 'name')
 * @param {string} options.sortOrder - Sıralama yönü ('ASC' veya 'DESC', varsayılan: 'ASC')
 * @returns {Promise<Object>} Kullanıcı listesi ve toplam sayı
 */
async function searchUsers(options = {}) {
    try {
        const {
            searchTerm = '',
            companyId = null,
            limit = 20,
            offset = 0,
            searchScope = 'all',
            sortBy = 'name',
            sortOrder = 'ASC'
        } = options;

        const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100); // Max 100, min 1
        const validOffset = Math.max(parseInt(offset) || 0, 0);
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        const validSortFields = ['id', 'name', 'surname', 'email', 'phone', 'username', 'created_at'];
        const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';

        let whereConditions = [];
        let params = [];
        let joins = '';

        if (searchTerm && searchTerm.trim() !== '') {
            const trimmed = searchTerm.trim();
            const searchPattern = `%${trimmed}%`;
            const isNumericId = /^[0-9]+$/.test(trimmed);

            const conditions = [
                'users.name LIKE ?',
                'users.surname LIKE ?',
                'users.email LIKE ?',
                'users.phone LIKE ?',
                'users.username LIKE ?',
                // ID her durumda LIKE ile aranır (INT ise CAST ile güvenli)
                'CAST(users.id AS CHAR) LIKE ?'
            ];

            const paramsList = [
                searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
                searchPattern
            ];

            // Sayısal bir ID girildiyse, index kullansın diye tam eşleşmeyi de ekle
            if (isNumericId) {
                conditions.unshift('users.id = ?');
                paramsList.unshift(Number(trimmed));
            }

            whereConditions.push(`(${conditions.join(' OR ')})`);
            params.push(...paramsList);
        }


        if (searchScope === 'company' && companyId) {
            joins = `
                INNER JOIN user_company_permissions ucp ON users.id = ucp.user_id
            `;
            whereConditions.push('ucp.company_id = ?');
            params.push(companyId);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const countQuery = `
            SELECT COUNT(DISTINCT users.id) as total
            FROM users
            ${joins}
            ${whereClause}
        `;

        const countResult = await queryAsync(countQuery, params);
        const totalCount = countResult[0]?.total || 0;

        const usersQuery = `
            SELECT DISTINCT
                users.id,
                users.name,
                users.surname,
                users.email,
                users.phone,
                users.username,
                users.emailverified,
                users.created_at
            FROM users
            ${joins}
            ${whereClause}
            ORDER BY users.${validSortBy} ${validSortOrder}
            LIMIT ? OFFSET ?
        `;

        const usersParams = [...params, validLimit, validOffset];
        const users = await queryAsync(usersQuery, usersParams);

        // Her kullanıcı için yetki kodlarını ve hesap ID'sini al
        const usersWithPermissions = await Promise.all(
            users.map(async (user) => {
                try {
                    const permissionsResult = await readUserPermissions(user.id, companyId);

                    // Kullanıcının hesap ID'sini al
                    let accountId = null;
                    try {
                        const accountsResult = await getAccountsByUserId(user.id, ['id'], companyId);
                        if (accountsResult.accounts && accountsResult.accounts.length > 0) {
                            accountId = accountsResult.accounts[0].id;
                        }
                    } catch (accountError) {
                        // Hesap bilgisi alınamazsa null olarak bırak
                    }

                    return {
                        ...user,
                        permissions: permissionsResult.permissions || [],
                        accountId: accountId
                    };
                } catch (error) {
                    // Yetki okuma hatası durumunda boş array döndür
                    return {
                        ...user,
                        permissionCodes: [],
                        accountId: null
                    };
                }
            })
        );

        const totalPages = Math.ceil(totalCount / validLimit);
        const currentPage = Math.floor(validOffset / validLimit) + 1;

        return {
            status: 200,
            message: t('users:search.success'),
            data: {
                users: usersWithPermissions || [],
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
            message: error.message || t('users:search.error'),
            error
        };
    }
}

/**
 * Firma içindeki kullanıcıları arar
 * @param {string} companyId - Firma ID
 * @param {Object} options - Arama parametreleri
 * @returns {Promise<Object>} Kullanıcı listesi
 */
async function searchUsersInCompany(companyId, options = {}) {
    if (!companyId) {
        throw {
            status: 400,
            message: t('users:search.companyIdRequired')
        };
    }

    return searchUsers({
        ...options,
        companyId,
        searchScope: 'company'
    });
}

/**
 * Tüm kullanıcıları arar
 * @param {Object} options - Arama parametreleri
 * @returns {Promise<Object>} Kullanıcı listesi
 */
async function searchAllUsers(options = {}) {
    return searchUsers({
        ...options,
        searchScope: 'all'
    });
}

module.exports = {
    searchUsers,
    searchUsersInCompany,
    searchAllUsers
};
