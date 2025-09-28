const { queryAsync } = require('../database/utils/connection');
const crypto = require('crypto');

/**
 * Benzersiz bir ID oluşturur
 * @param {string} tag - ID için önek (örn: 'USR', 'EMC')
 * @returns {string} Oluşturulan ID
 */
function generateId(tag) {
    const id = crypto.randomBytes(8).toString('hex'); // 8 bayt = 16 karakter
    return tag ? `${tag}_${id}` : id;
}

/**
 * Belirli bir tabloda benzersiz bir ID oluşturur
 * @param {string} prefix - ID için ön ek (örn: 'USR', 'EMC')
 * @param {string} tableName - Kontrol edilecek tablo adı
 * @param {string} idColumnName - ID sütunu adı (varsayılan: 'id')
 * @returns {Promise<string>} Benzersiz ID
 */
async function generateUniqueId(prefix, tableName, idColumnName = 'id') {
    let newId;

    // Benzersiz ID oluştur
    while (true) {
        newId = generateId(prefix);
        const checkIdSql = `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${idColumnName} = ?`;
        const [checkResult] = await queryAsync(checkIdSql, [newId]);

        if (checkResult.count === 0) {
            break;
        }
    }

    return newId;
}


module.exports = {
    generateUniqueId
};
