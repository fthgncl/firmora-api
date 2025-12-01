const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');
const getCompanyById = require('./getCompanyById');

/**
 * Şirket siler
 * @param {string} companyId - Silinecek şirket ID
 * @returns {Promise<object>} Silme sonucu
 */
const deleteCompany = async (companyId) => {
    try {
        // Şirketin var olup olmadığını kontrol et
        const existingCompany = await getCompanyById(companyId, ['id', 'company_name']);
        if (!existingCompany) {
            throw new Error(t('companies:delete.notFound'));
        }

        // Şirketi sil
        await deleteCompanyFromDatabase(companyId);

        return {
            status: 'success',
            message: t('companies:delete.success'),
            deletedCompany: {
                id: companyId,
                company_name: existingCompany.company_name
            }
        };
    } catch (error) {
        error.message = `${t('companies:delete.error')} - ${error.message}`;
        throw error;
    }
};

const deleteCompanyFromDatabase = async (companyId) => {
    const sql = 'DELETE FROM companies WHERE id = ?';
    const result = await queryAsync(sql, [companyId]);

    if (result.affectedRows === 0) {
        throw new Error(t('companies:delete.notFound'));
    }
};

module.exports = deleteCompany;
