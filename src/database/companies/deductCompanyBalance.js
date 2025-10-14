const { queryAsync } = require('../utils/connection');

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
            throw new Error('Geçersiz miktar. Pozitif bir değer giriniz.');
        }

        // Firmayı ve bakiyesini kontrol et
        const company = await queryAsync(
            'SELECT id, balance FROM companies WHERE id = ?',
            [companyId]
        );

        if (company.length === 0) {
            throw new Error('Firma bulunamadı');
        }

        // Yetersiz bakiye kontrolü
        if (company[0].balance < amount) {
            throw new Error('Yetersiz bakiye');
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
            companyId: companyId,
            deductedAmount: amount,
            newBalance: updatedCompany[0].balance,
            message: 'Bakiye başarıyla düşürüldü'
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Bakiye düşürülürken bir hata oluştu'
        };
    }
};

module.exports = deductCompanyBalance;
