const { queryAsync } = require('../utils/connection');
const logError = require('../../utils/logger');
const tablesConfig = require('../../config/tablesConfig');
const { t } = require('../../config/i18nConfig');

/**
 * Kullanıcı bilgilerini ID'ye göre getirir
 * @param {string} userId - Kullanıcı ID
 * @param {string[]} fields - Çekilecek alanlar
 * @returns {Promise<object|null>} Kullanıcı bilgileri veya null
 * @throws {Error} Geçerli alan belirtilmezse veya alan doğrulaması başarısız olursa
 */
async function getUserById(userId, fields) {
    if (!userId) {
        throw new Error(t('users:getUserById.userIdRequired'));
    }

    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error(t('users:getUserById.fieldsRequired'));
    }

    // Kullanıcı tablosunda tanımlı tüm geçerli alanları al
    const validTableFields = Object.keys(tablesConfig.users);

    // Talep edilen alanları doğrula
    const validFields = fields.filter(field => validTableFields.includes(field));
    const invalidFields = fields.filter(field => !validTableFields.includes(field));

    // Geçersiz alanları logla
    if (invalidFields.length > 0) {
        await logError(`${t('users:getUserById.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
    }

    if (validFields.length === 0) {
        throw new Error(t('users:getUserById.validFieldsRequired'));
    }

    // SQL sorgusunu oluştur
    const sql = `SELECT ${validFields.join(', ')} FROM users WHERE id = ?`;

    // Sorguyu çalıştır
    const users = await queryAsync(sql, [userId]);

    // Sonucu döndür
    return users.length > 0 ? users[0] : null;
}

module.exports = getUserById;
