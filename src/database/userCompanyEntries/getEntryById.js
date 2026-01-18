const {queryAsync} = require('../utils/connection');
const {t} = require('../../config/i18n.config');
const tablesConfig = require('../../config/tables.config');
const getCompanyById = require('../companies/getCompanyById');
const getUserById = require('../users/getUserById');

/**
 Giriş/Çıkış bilgilerini ID'ye göre getirir
 @param {string} entryId - Giriş/Çıkış ID
 * @param {string[]} fields - Çekilecek alanlar (opsiyonel, verilmezse tüm alanlar)
 * @returns {Promise<{status: string, message: string, account: Object}>} Hesap bilgisi
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
const getEntryById = async (entryId, fields = null) => {
    try {
        if (!entryId) {
            throw {
                status: 400,
                message: t('workStatus:getEntryById.entryIdRequired')
            };
        }

        // Eğer fields belirtilmemişse tüm alanları getir
        let validFields;
        if (!fields || fields.length === 0) {
            validFields = Object.keys(tablesConfig.user_company_entries);
        } else {
            // Kullanıcı tablosunda tanımlı tüm geçerli alanları al
            const validTableFields = Object.keys(tablesConfig.user_company_entries);

            // Talep edilen alanları doğrula
            validFields = fields.filter(field => validTableFields.includes(field));
            const invalidFields = fields.filter(field => !validTableFields.includes(field));

            // Geçersiz alanlar varsa hata fırlat
            if (invalidFields.length > 0) {
                throw {
                    status: 400,
                    message: `${t('workStatus:getEntryById.invalidFieldsLog')}: ${invalidFields.join(', ')}`
                };
            }

            if (validFields.length === 0) {
                throw {
                    status: 400,
                    message: t('workStatus:getEntryById.validFieldsRequired')
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
                     FROM user_company_entries
                     WHERE id = ?`;

        // Sorguyu çalıştır
        const entries = await queryAsync(sql, [entryId]);

        // Giriş/Çıkış kaydı bulunamadıysa hata fırlat
        if (!entries || entries.length === 0) {
            throw {
                status: 404,
                message: t('workStatus:getEntryById.notFound')
            };
        }

        const entry = entries[0];

        // Kullanıcı bilgilerini getir
        let user = null;
        if (entry.user_id) {
            try {
                user = await getUserById(entry.user_id, ['name', 'surname']);
                entry.name = entry.name || `${user.name} ${user.surname}`.trim();
            } catch (error) {
                throw {
                    status: error.status || 500,
                    message: `${t('workStatus:getEntryById.userFetchError')}: ${error.message || error}`
                };
            }
        }

        // Firma bilgilerini getir
        let company = null;
        if (entry.company_id) {
            try {
                company = await getCompanyById(entry.company_id, ['id', 'company_name', 'sector']);
            } catch (error) {
                throw {
                    status: error.status || 500,
                    message: `${t('workStatus:getEntryById.companyFetchError')}: ${error.message || error}`
                };
            }
        }

        // Gereksiz alanları temizle
        delete entry.company_id;

        return {
            status: 'success',
            message: t('workStatus:getEntryById.success'),
            data: {
                entry,
                company: company || null,
            }
        };
    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('workStatus:getEntryById.error'),
            error
        };
    }
};

module.exports = getEntryById;