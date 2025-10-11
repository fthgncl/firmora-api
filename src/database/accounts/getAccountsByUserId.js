const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18nConfig');
const tablesConfig = require('../../config/tablesConfig');
const logError = require('../../utils/logger');
const getCompanyById = require('../companies/getCompanyById');
const getUserById = require('../users/getUserById');

/**
 * Kullanıcının hesaplarını getirir
 * @param {string} userId - Kullanıcı ID
 * @param {string[]} fields - Çekilecek alanlar (opsiyonel, verilmezse tüm alanlar)
 * @param {string} companyId - Firma ID filtresi (opsiyonel)
 * @returns {Promise<Array>} Kullanıcının hesapları
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
const getAccountsByUserId = async (userId, fields = null, companyId = null) => {
    try {
        if (!userId) {
            throw new Error(t('accounts.getByUserId.userIdRequired'));
        }

        // Eğer fields belirtilmemişse tüm alanları getir
        let validFields;
        if (!fields || fields.length === 0) {
            validFields = Object.keys(tablesConfig.user_accounts);
        } else {
            // Kullanıcı tablosunda tanımlı tüm geçerli alanları al
            const validTableFields = Object.keys(tablesConfig.user_accounts);

            // Talep edilen alanları doğrula
            validFields = fields.filter(field => validTableFields.includes(field));
            const invalidFields = fields.filter(field => !validTableFields.includes(field));

            // Geçersiz alanları logla
            if (invalidFields.length > 0) {
                await logError(`${t('accounts.getByUserId.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
            }

            if (validFields.length === 0) {
                throw new Error(t('accounts.getByUserId.validFieldsRequired'));
            }

            // Firma bilgilerini getirmek için company_id'nin mutlaka çekilmesi gerekiyor
            if (!validFields.includes('company_id')) {
                validFields.push('company_id');
            }
        }

        // SQL sorgusunu oluştur
        let sql = `SELECT ${validFields.join(', ')} FROM user_accounts WHERE user_id = ?`;
        const params = [userId];

        // Firma ID filtresi varsa ekle
        if (companyId) {
            sql += ' AND company_id = ?';
            params.push(companyId);
        }

        // Sorguyu çalıştır
        const accounts = await queryAsync(sql, params);
        const user = await getUserById(userId, ['name', 'surname']);

        // Her hesap için firma bilgilerini getir
        const accountsWithCompany = await Promise.all(
            accounts.map(async (account) => {
                // Eğer hesabın company_id'si varsa firma bilgilerini getir
                if (account.company_id) {
                    try {
                        const company = await getCompanyById(account.company_id, ['id', 'company_name', 'sector', 'currency']);
                        delete account.company_id;
                        return {
                            ...account,
                            company: company || null
                        };
                    } catch (error) {
                        // Firma bilgisi alınamazsa null olarak ekle
                        await logError(`${t('accounts.getByUserId.companyFetchError')}: ${error.message}`);
                        return {
                            ...account,
                            company: null
                        };
                    }
                }
                return {
                    ...account,
                    company: null
                };
            })
        );

        return {
            status: 'success',
            message: t('accounts.getByUserId.success'),
            user,
            accounts: accountsWithCompany || []
        };
    } catch (error) {
        throw {
            status: 500,
            message: error.message || t('accounts.getByUserId.error'),
            error
        };
    }
};

module.exports = getAccountsByUserId;