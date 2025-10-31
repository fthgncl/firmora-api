const {queryAsync} = require('../utils/connection');
const {t} = require('../../config/i18nConfig');
const tablesConfig = require('../../config/tablesConfig');
const getCompanyById = require('../companies/getCompanyById');
const getUserById = require('../users/getUserById');

/**
 * ID'ye göre hesap getirir
 * @param {string} accountId - Hesap ID
 * @param {string[]} fields - Çekilecek alanlar (opsiyonel, verilmezse tüm alanlar)
 * @returns {Promise<{status: string, message: string, account: Object}>} Hesap bilgisi
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
const getAccountById = async (accountId, fields = null) => {
    try {
        if (!accountId) {
            throw {
                status: 400,
                message: t('accounts:getById.accountIdRequired')
            };
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

            // Geçersiz alanlar varsa hata fırlat
            if (invalidFields.length > 0) {
                throw {
                    status: 400,
                    message: `${t('accounts:getById.invalidFieldsLog')}: ${invalidFields.join(', ')}`
                };
            }

            if (validFields.length === 0) {
                throw {
                    status: 400,
                    message: t('accounts:getById.validFieldsRequired')
                };
            }

            // Firma ve kullanıcı bilgilerini getirmek için gerekli alanlar
            if (!validFields.includes('company_id')) {
                validFields.push('company_id');
            }
            if (!validFields.includes('user_id')) {
                validFields.push('user_id');
            }
        }

        // SQL sorgusunu oluştur
        const sql = `SELECT ${validFields.join(', ')}
                     FROM user_accounts
                     WHERE id = ?`;

        // Sorguyu çalıştır
        const accounts = await queryAsync(sql, [accountId]);

        // Hesap bulunamadıysa hata fırlat
        if (!accounts || accounts.length === 0) {
            throw {
                status: 404,
                message: t('accounts:getById.notFound')
            };
        }

        const account = accounts[0];

        // Kullanıcı bilgilerini getir
        let user = null;
        if (account.user_id) {
            try {
                user = await getUserById(account.user_id, ['name', 'surname']);
                account.name = account.name || `${user.name} ${user.surname}`.trim();
            } catch (error) {
                throw {
                    status: error.status || 500,
                    message: `${t('accounts:getById.userFetchError')}: ${error.message || error}`
                };
            }
        }

        // Firma bilgilerini getir
        let company = null;
        if (account.company_id) {
            try {
                company = await getCompanyById(account.company_id, ['id', 'company_name', 'sector', 'currency']);
            } catch (error) {
                throw {
                    status: error.status || 500,
                    message: `${t('accounts:getById.companyFetchError')}: ${error.message || error}`
                };
            }
        }

        // Gereksiz alanları temizle
        delete account.company_id;

        return {
            status: 'success',
            message: t('accounts:getById.success'),
            data: {
                account,
                company: company || null,
            }
        };
    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('accounts:getById.error'),
            error
        };
    }
};

module.exports = getAccountById;