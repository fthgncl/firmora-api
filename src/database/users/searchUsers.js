const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');
const { readUserPermissions } = require('../../utils/permissionsManager');

/**
 * Kullanıcıları arar ve sayfalama ile sonuçları döndürür
 * @param {Object} options - Arama parametreleri
 * @param {string} options.searchTerm - Aranacak terim (isim, email, telefon, username)
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

        const validSortFields = ['name', 'surname', 'email', 'phone', 'username', 'created_at'];
        const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';

        let whereConditions = [];
        let params = [];
        let joins = '';

        if (searchTerm && searchTerm.trim() !== '') {
            const searchPattern = `%${searchTerm.trim()}%`;
            whereConditions.push(`(
                users.name LIKE ? OR 
                users.surname LIKE ? OR 
                users.email LIKE ? OR 
                users.phone LIKE ? OR
                users.username LIKE ?
            )`);
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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

        // Her kullanıcı için yetki kodlarını al
        const usersWithPermissions = await Promise.all(
            users.map(async (user) => {
                try {
                    const permissionsResult = await readUserPermissions(user.id, companyId);
                    return {
                        ...user,
                        permissions: permissionsResult.permissions || []
                    };
                } catch (error) {
                    // Yetki okuma hatası durumunda boş array döndür
                    return {
                        ...user,
                        permissionCodes: []
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
