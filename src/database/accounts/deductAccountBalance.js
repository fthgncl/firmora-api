const { queryAsync } = require('../utils/connection');

/**
 * Kullanıcının belirli bir firmadaki hesabından para çıkarır
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @param {number} amount - Çıkarılacak miktar
 * @returns {Promise<Object>} Güncellenen bakiye bilgisi
 * @throws {Error} Hata durumunda veya yetersiz bakiye
 */
const deductAccountBalance = async (userId, companyId, amount) => {
    try {
        // Miktar kontrolü
        if (!amount || amount <= 0) {
            throw new Error('Geçersiz miktar. Pozitif bir değer giriniz.');
        }

        // Kullanıcı hesabını ve bakiyesini kontrol et
        const account = await queryAsync(
            'SELECT id, balance FROM user_accounts WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (account.length === 0) {
            throw new Error('Kullanıcı hesabı bulunamadı');
        }

        // Yetersiz bakiye kontrolü
        if (account[0].balance < amount) {
            throw new Error('Yetersiz bakiye');
        }

        // Bakiyeyi güncelle
        await queryAsync(
            'UPDATE user_accounts SET balance = balance - ? WHERE user_id = ? AND company_id = ?',
            [amount, userId, companyId]
        );

        // Güncel bakiyeyi al
        const updatedAccount = await queryAsync(
            'SELECT id, balance FROM user_accounts WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        return {
            success: true,
            userId: userId,
            companyId: companyId,
            deductedAmount: amount,
            newBalance: updatedAccount[0].balance,
            message: 'Hesap bakiyesi başarıyla düşürüldü'
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || 'Hesap bakiyesi düşürülürken bir hata oluştu'
        };
    }
};

module.exports = deductAccountBalance;
