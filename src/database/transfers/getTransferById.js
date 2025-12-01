const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18n.config");
const logError = require('../../utils/logger');
const tablesConfig = require('../../config/tables.config');

/**
 * Transfer ID'sine göre transfer bilgilerini getirir
 * @param {string} transferId - Transfer ID
 * @param {string[]} fields - Çekilecek alanlar (opsiyonel, belirtilmezse tüm alanlar çekilir)
 * @returns {Promise<Object|null>} Transfer bilgileri veya null
 */
const getTransferById = async (transferId, fields = null) => {
    try {

        if (!transferId) {
            throw new Error(t('transfers:getById.transferIdRequired'));
        }

        if (typeof transferId !== 'string') {
            throw new Error(t('transfers:getById.invalidTransferId'));
        }

        let sql;

        // Eğer fields belirtilmemişse tüm alanları çek
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            sql = `SELECT * FROM transfers WHERE id = ?`;
        } else {
            // Transfer tablosunda tanımlı tüm geçerli alanları al
            const validTableFields = Object.keys(tablesConfig.transfers);

            // Talep edilen alanları doğrula
            const validFields = fields.filter(field => validTableFields.includes(field));
            const invalidFields = fields.filter(field => !validTableFields.includes(field));

            // Geçersiz alanları logla
            if (invalidFields.length > 0) {
                await logError(`${t('transfers:getById.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
            }

            if (validFields.length === 0) {
                throw new Error(t('transfers:getById.validFieldsRequired'));
            }

            // SQL sorgusunu oluştur
            sql = `SELECT ${validFields.join(', ')} FROM transfers WHERE id = ?`;
        }

        const result = await queryAsync(sql, [transferId]);

        // Sonuç kontrolü
        if (!result || result.length === 0) {
            throw new Error(t('transfers:getById.notFound'));
        }

        return result[0];

    } catch (error) {
        throw error;
    }
};

module.exports = getTransferById;
