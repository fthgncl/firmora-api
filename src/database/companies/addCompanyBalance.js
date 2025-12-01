const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');

/**
 * Firmaya belirli bir miktar para ekler
 * @param {string} companyId - Firma ID
 * @param {number} amount - Eklenecek miktar
 * @returns {Promise<Object>} Güncellenen bakiye bilgisi
 * @throws {Error} Hata durumunda
 */
const addCompanyBalance = async (companyId, amount) => {
    try {
        // Miktar kontrolü
        if (!amount || amount <= 0) {
            throw new Error(t('companies:invalidAmount'));
        }

        // Firmayı kontrol et
        const company = await queryAsync(
            'SELECT balance FROM companies WHERE id = ?',
            [companyId]
        );

        if (company.length === 0) {
            throw new Error(t('companies:notFound'));
        }

        // Bakiyeyi güncelle
        await queryAsync(
            'UPDATE companies SET balance = balance + ? WHERE id = ?',
            [amount, companyId]
        );

        // Güncel bakiyeyi al
        const updatedCompany = await queryAsync(
            'SELECT id, balance FROM companies WHERE id = ?',
            [companyId]
        );

        return {
            success: true,
            companyId,
            addedAmount: amount,
            newBalance: updatedCompany[0].balance,
            message: t('companies:balanceAdded')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('companies:balanceAddError')
        };
    }
};

module.exports = addCompanyBalance;
