const { queryAsync } = require('../utils/connection');
const logError = require('../../utils/logger');
const tablesConfig = require('../../config/tablesConfig');
const { t } = require('../../config/i18nConfig');

/**
 * Sahip ID'sine göre şirketleri getirir
 * @param {string} ownerId - Sahip ID
 * @param {string[]} fields - Çekilecek alanlar
 * @returns {Promise<Array>} Şirket listesi
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
async function getCompaniesByOwnerId(ownerId, fields = ["id"]) {
  if (!ownerId) {
    throw new Error(t('companies.getCompaniesByOwnerId.ownerIdRequired'));
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error(t('companies.getCompaniesByOwnerId.fieldsRequired'));
  }

  // Şirket tablosunda tanımlı tüm geçerli alanları al
  const validTableFields = Object.keys(tablesConfig.companies);

  // Talep edilen alanları doğrula
  const validFields = fields.filter(field => validTableFields.includes(field));
  const invalidFields = fields.filter(field => !validTableFields.includes(field));

  // Geçersiz alanları logla
  if (invalidFields.length > 0) {
    await logError(`${t('companies.getCompaniesByOwnerId.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
  }

  if (validFields.length === 0) {
    throw new Error(t('companies.getCompaniesByOwnerId.validFieldsRequired'));
  }

  // SQL sorgusunu oluştur
  const sql = `SELECT ${validFields.join(', ')} FROM companies WHERE owner_id = ? ORDER BY created_at DESC`;

  // Sorguyu çalıştır
  const companies = await queryAsync(sql, [ownerId]);

  // Sonucu döndür
  return companies;
}

module.exports = getCompaniesByOwnerId;
