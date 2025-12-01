const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');

/**
 * Kullanıcının belirli bir firmadaki hesabına para ekler
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @param {number} amount - Eklenecek miktar
 * @returns {Promise<Object>} Güncellenen bakiye bilgisi
 * @throws {Error} Hata durumunda
 */
const addAccountBalance = async (userId, companyId, amount) => {
    try {
        // Miktar kontrolü
        if (!amount || amount <= 0) {
            throw new Error(t('accounts:invalidAmount'));
        }

        // Kullanıcı hesabını kontrol et
        const account = await queryAsync(
            'SELECT id, balance FROM user_accounts WHERE user_id = ? AND company_id = ?',
            [userId, companyId]
        );

        if (account.length === 0) {
            throw new Error(t('accounts:accountNotFound'));
        }

        // Bakiyeyi güncelle
        await queryAsync(
            'UPDATE user_accounts SET balance = balance + ? WHERE user_id = ? AND company_id = ?',
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
            addedAmount: amount,
            newBalance: updatedAccount[0].balance,
            message: t('accounts:balanceAdded')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('accounts:balanceAddError')
        };
    }
};

module.exports = addAccountBalance;
