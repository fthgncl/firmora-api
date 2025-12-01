const { queryAsync } = require('../utils/connection');
const logError = require('../../utils/logger');
const tablesConfig = require('../../config/tables.config');
const { t } = require('../../config/i18n.config');

/**
 * Şirket bilgilerini ID'ye göre getirir
 * @param {string} companyId - Şirket ID
 * @param {string[]} fields - Çekilecek alanlar
 * @returns {Promise<object|null>} Şirket bilgileri veya null
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
async function getCompanyById(companyId, fields) {

    if (!companyId) {
        throw new Error(t('companies:getCompanyById.companyIdRequired'));
    }

    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error(t('companies:getCompanyById.fieldsRequired'));
    }

    // Şirket tablosunda tanımlı tüm geçerli alanları al
    const validTableFields = Object.keys(tablesConfig.companies);

    // Talep edilen alanları doğrula
    const validFields = fields.filter(field => validTableFields.includes(field));
    const invalidFields = fields.filter(field => !validTableFields.includes(field));

    // Geçersiz alanları logla
    if (invalidFields.length > 0) {
        await logError(`${t('companies:getCompanyById.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
    }

    if (validFields.length === 0) {
        throw new Error(t('companies:getCompanyById.validFieldsRequired'));
    }

    // SQL sorgusunu oluştur
    const sql = `SELECT ${validFields.join(', ')} FROM companies WHERE id = ?`;

    // Sorguyu çalıştır
    const companies = await queryAsync(sql, [companyId]);

    // Sonucu döndür
    return companies.length > 0 ? companies[0] : null;
}

module.exports = getCompanyById;
