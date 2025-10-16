const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');

/**
 * Firmadan belirli bir miktar para çıkarır
 * @param {string} companyId - Firma ID
 * @param {number} amount - Çıkarılacak miktar
 * @returns {Promise<Object>} Güncellenen bakiye bilgisi
 * @throws {Error} Hata durumunda veya yetersiz bakiye
 */
const deductCompanyBalance = async (companyId, amount) => {
    try {
        // Miktar kontrolü
        if (!amount || amount <= 0) {
            throw new Error(t('companies:deductBalance.invalidAmount'));
        }

        // Firmayı ve bakiyesini kontrol et
        const company = await queryAsync(
            'SELECT id, balance FROM companies WHERE id = ?',
            [companyId]
        );

        if (company.length === 0) {
            throw new Error(t('companies:deductBalance.notFound'));
        }

        // Yetersiz bakiye kontrolü
        if (company[0].balance < amount) {
            throw new Error(t('companies:deductBalance.insufficientBalance'));
        }

        // Bakiyeyi güncelle
        await queryAsync(
            'UPDATE companies SET balance = balance - ? WHERE id = ?',
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
            deductedAmount: amount,
            newBalance: updatedCompany[0].balance,
            message: t('companies:deductBalance.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('companies:deductBalance.error')
        };
    }
};

module.exports = deductCompanyBalance;
