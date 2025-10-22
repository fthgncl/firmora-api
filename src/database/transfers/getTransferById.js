const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18nConfig");

/**
 * Transfer ID'sine göre transfer bilgilerini getirir
 * @param {string} transferId - Transfer ID
 * @returns {Promise<Object|null>} Transfer bilgileri veya null
 */
const getTransferById = async (transferId) => {
    try {

        if (!transferId ) {
            throw new Error(t('transfers:getById.transferIdRequired'));
        }

        if (typeof transferId !== 'string') {
            throw new Error(t('transfers:getById.invalidTransferId'));
        }

        const result = await queryAsync(`SELECT * FROM transfers WHERE id = ?`, [transferId]);

        // Sonuç kontrolü
        if (!result || result.length === 0) {
            throw new Error(t('transfers:getById.notFound'));
        }

        return result;

    } catch (error) {
        throw error;
    }
};

module.exports = getTransferById;
