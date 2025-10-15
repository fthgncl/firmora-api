const { queryAsync } = require('./connection');
const { readUserPermissions } = require('../../utils/permissionsManager');
const { t } = require('../../config/i18nConfig');
const {isValidAmount} = require("../../utils/validation");

/**
 * Firma ID'sine göre firmanın para birimini getirir
 * @param {string} companyId - Firma ID
 * @throws {Error} Firma bulunamazsa veya para birimi yoksa hata fırlatır
 * @returns {Promise<string>} Firma para birimi
 */
const getCompanyCurrency = async (companyId) => {
    try {
        const query = 'SELECT currency FROM companies WHERE id = ?';
        const results = await queryAsync(query, [companyId]);

        if (!results || results.length === 0) {
            throw new Error(t('companies.delete.notFound'));
        }

        if (!results[0].currency) {
            throw new Error(t('errors.company_currency_not_found'));
        }

        return results[0].currency;
    } catch (error) {
        throw error;
    }
};

/**
 * Kullanıcının belirli bir firmadaki hesabının para birimini getirir
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @throws {Error} Hesap bulunamazsa veya para birimi yoksa hata fırlatır
 * @returns {Promise<string>} Hesap para birimi
 */
const getUserAccountCurrency = async (userId, companyId) => {
    try {
        const query = 'SELECT currency FROM user_accounts WHERE user_id = ? AND company_id = ?';
        const results = await queryAsync(query, [userId, companyId]);

        if (!results || results.length === 0) {
            throw new Error(t('errors.user_account_not_found'));
        }

        if (!results[0].currency) {
            throw new Error(t('errors.account_currency_not_found'));
        }

        return results[0].currency;
    } catch (error) {
        throw error;
    }
};

/**
 * Kullanıcının belirli bir firmada olup olmadığını kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @throws {Object} Kullanıcı firmada değilse hata fırlatır
 * @returns {Promise<Object>} Kullanıcı yetkileri
 */
const validateUserInCompany = async (userId, companyId) => {
    try {
        const result = await readUserPermissions(userId, companyId);

        // Eğer kullanıcının bu firmada herhangi bir yetkisi varsa, firmada bulunuyor demektir
        if (!result.permissions || result.permissions.length === 0) {
            throw {
                status: 400,
                message: t('transfers.create.userNotInCompany')
            };
        }

        return result;
    } catch (error) {
        throw {
            status: error.status || 400,
            message: error.message || t('transfers.create.userNotInCompany')
        };
    }
};

/**
 * Transfer miktarının geçerli olup olmadığını kontrol eder
 * @param {number} amount - Transfer miktarı
 * @throws {Object} Miktar geçersizse hata fırlatır
 */
// Maksimum 2 ondalık basamaklı, geçerli para formatı

const validateAmount = (amount) => {
    if (amount === undefined || amount === null)
        throw Object.assign(new Error(t('transfers.create.invalidAmount')), { status: 400 });

    const str = amount.toString().trim();
    const numAmount = parseFloat(str);

    // Sayısal ve pozitif olmalı
    if (isNaN(numAmount) || numAmount <= 0)
        throw Object.assign(new Error(t('transfers.create.invalidAmount')), { status: 400 });

    // Format kontrolü
    if (!isValidAmount(amount))
        throw Object.assign(new Error(t('transfers.create.invalidAmountFormat')), { status: 400 });

    return true;
};

/**
 * Firmanın yeterli bakiyeye sahip olup olmadığını kontrol eder
 * @param {string} companyId - Firma ID
 * @param {number} amount - Gerekli miktar
 * @throws {Object} Yetersiz bakiye varsa hata fırlatır
 * @returns {Promise<Object>} Firma bilgileri
 */
const validateCompanyBalance = async (companyId, amount) => {
    try {
        const query = 'SELECT balance FROM companies WHERE id = ?';
        const result = await queryAsync(query, [companyId]);

        if (!result || result.length === 0) {
            throw {
                status: 404,
                message: t('company.notFound')
            };
        }

        if (parseFloat(result[0].balance) < parseFloat(amount)) {
            throw {
                status: 400,
                message: t('company.insufficientBalance')
            };
        }

        return result[0];
    } catch (error) {
        throw {
            status: error.status || 400,
            message: error.message || t('company.insufficientBalance')
        };
    }
};




















/**
 * Kullanıcının yeterli bakiyeye sahip olup olmadığını kontrol eder
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Firma ID
 * @param {number} amount - Gerekli miktar
 * @throws {Object} Yetersiz bakiye varsa hata fırlatır
 * @returns {Promise<Object>} Kullanıcı hesap bilgileri
 */
const validateUserBalance = async (userId, companyId, amount) => {
    try {
        const account = await validateUserAccountExists(userId, companyId);

        if (parseFloat(account.balance) < parseFloat(amount)) {
            throw {
                status: 400,
                message: t('account.insufficientBalance')
            };
        }

        return account;
    } catch (error) {
        throw {
            status: error.status || 400,
            message: error.message || t('account.insufficientBalance')
        };
    }
};





module.exports = {
    getCompanyCurrency,
    getUserAccountCurrency,
    validateUserInCompany,
    validateUserBalance,
    validateCompanyBalance,
    validateAmount
};
