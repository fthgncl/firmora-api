const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');

/**
 * Firmaları arar ve sayfalama ile sonuçları döndürür
 * @param {Object} options - Arama parametreleri
 * @param {string} options.searchTerm - Aranacak terim (firma adı veya sektör)
 * @param {number} options.limit - Sayfa başına sonuç sayısı (varsayılan: 20)
 * @param {number} options.offset - Atlanacak kayıt sayısı (varsayılan: 0)
 * @param {string} options.sortBy - Sıralama alanı (varsayılan: 'company_name')
 * @param {string} options.sortOrder - Sıralama yönü ('ASC' veya 'DESC', varsayılan: 'ASC')
 * @returns {Promise<Object>} Firma listesi ve toplam sayı
 */
async function searchCompanies(options = {}) {
    try {
        const {
            searchTerm = '',
            limit = 20,
            offset = 0,
            sortBy = 'company_name',
            sortOrder = 'ASC'
        } = options;

        const validLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const validOffset = Math.max(parseInt(offset) || 0, 0);
        const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

        const validSortFields = ['company_name', 'sector', 'currency', 'created_at'];
        const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'company_name';

        let whereConditions = [];
        let params = [];

        if (searchTerm && searchTerm.trim() !== '') {
            const searchPattern = `%${searchTerm.trim()}%`;
            whereConditions.push(`(
                companies.company_name LIKE ? OR 
                companies.sector LIKE ?
            )`);
            params.push(searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(companies.id) as total
            FROM companies
                     ${whereClause}
        `;
        const countResult = await queryAsync(countQuery, params);
        const totalCount = countResult[0]?.total || 0;

        const companiesQuery = `
            SELECT
                companies.id,
                companies.company_name,
                companies.sector,
                companies.currency,
                companies.owner_id,
                companies.created_at
            FROM companies
                     ${whereClause}
            ORDER BY companies.${validSortBy} ${validSortOrder}
            LIMIT ? OFFSET ?
        `;
        const companiesParams = [...params, validLimit, validOffset];
        const companies = await queryAsync(companiesQuery, companiesParams);

        const totalPages = Math.ceil(totalCount / validLimit);
        const currentPage = Math.floor(validOffset / validLimit) + 1;

        return {
            status: 200,
            message: t('companies:search.success'),
            data: {
                companies: companies || [],
                pagination: {
                    total: totalCount,
                    limit: validLimit,
                    offset: validOffset,
                    currentPage,
                    totalPages,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            }
        };
    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('companies:search.error'),
            error
        };
    }
}

module.exports = {
    searchCompanies
};
