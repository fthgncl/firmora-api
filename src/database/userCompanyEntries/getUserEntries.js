const { queryAsync } = require('../utils/connection');

/**
 * Kullanıcının belirli tarihler arasındaki giriş-çıkış kayıtlarını getirir
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Şirket ID
 * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD formatında)
 * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD formatında)
 * @returns {Promise<Array>} Giriş-çıkış kayıtları
 */
const getUserEntries = async (userId, companyId, startDate, endDate) => {
    const query = `
        SELECT id,
               user_id,
               company_id,
               entry_type,
               note,
               created_at
        FROM user_company_entries
        WHERE user_id = ?
          AND company_id = ?
          AND DATE(created_at) >= ?
          AND DATE(created_at) <= ?
        ORDER BY created_at
    `;

    return await queryAsync(query, [userId, companyId, startDate, endDate]);
};

module.exports = getUserEntries;
