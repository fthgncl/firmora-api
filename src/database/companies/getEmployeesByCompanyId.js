const { queryAsync } = require('../utils/connection');
const logError = require('../../utils/logger');
const tablesConfig = require('../../config/tablesConfig');
const { t } = require('../../config/i18nConfig');

/**
 * Şirket ID'sine göre çalışanları getirir
 * @param {string} companyId - Şirket ID
 * @param {string[]} fields - Çekilecek kullanıcı alanları (users tablosundan)
 * @param {number|null} limit - Getirilecek kayıt sayısı (null ise tümü)
 * @returns {Promise<Array>} Çalışan listesi
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
async function getEmployeesByCompanyId(companyId, fields, limit = null) {
    if (!companyId) {
        throw new Error(t('companies:getEmployeesByCompanyId.companyIdRequired'));
    }

    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error(t('companies:getEmployeesByCompanyId.fieldsRequired'));
    }

    // Users tablosunda tanımlı tüm geçerli alanları al
    const validTableFields = Object.keys(tablesConfig.users);

    // Talep edilen alanları doğrula
    const validFields = fields.filter(field => validTableFields.includes(field));
    const invalidFields = fields.filter(field => !validTableFields.includes(field));

    // Geçersiz alanları logla
    if (invalidFields.length > 0) {
        await logError(`${t('companies:getEmployeesByCompanyId.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
    }

    if (validFields.length === 0) {
        throw new Error(t('companies:getEmployeesByCompanyId.validFieldsRequired'));
    }

    // SQL sorgusunu oluştur - users tablosundan alanları seç ve user_company_permissions ile JOIN yap
    const selectedFields = validFields.map(field => `u.${field}`).join(', ');
    let sql = `
        SELECT ${selectedFields}
        FROM users u
                 INNER JOIN user_company_permissions ucp ON u.id = ucp.user_id
        WHERE ucp.company_id = ?
        ORDER BY u.created_at DESC
    `;

    // Limit varsa ekle
    if (limit && typeof limit === 'number' && limit > 0) {
        sql += ` LIMIT ${limit}`;
    }

    // Sorguyu çalıştır
    return await queryAsync(sql, [companyId]);

}

module.exports = getEmployeesByCompanyId;
