const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');
const getEntryById = require('./getEntryById');

const getErrorMessages = (error) => {
    const errorMessages = {};
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('id')) {
            errorMessages.entry_name = t('workStatus:update.duplicateEntryName');
        }
    } else {
        errorMessages.general = t('workStatus:update.unknownError');
    }
    return errorMessages;
};

const updateEntry = async (entryId, updateData) => {
    try {
        // Şirketin var olup olmadığını kontrol et
        const {data: {entry}} = await getEntryById(entryId, ['id']);

        // Veritabanında güncelle
        await updateEntryInDatabase(entry.id, updateData);

        return {
            status: 'success',
            message: t('workStatus:update.success'),
            updatedFields: updateData
        };
    } catch (error) {
        console.log(error);
        // getEntryById'den gelen hatalar zaten yapılandırılmış olarak gelir
        if (error.status && error.message && error.statusCode) {
            throw error;
        }

        // getEntryById'nin eski formatındaki hataları yakala (status property'si var ama statusCode yok)
        if (error.status && error.message && !error.statusCode) {
            throw {
                status: 'error',
                message: error.message,
                statusCode: error.status,
                errorMessages: { general: error.message }
            };
        }

        // Veritabanı hatalarını ele al
        if (error.code) {
            const errorMessages = getErrorMessages(error);
            const statusCode = error.code === 'ER_DUP_ENTRY' ? 400 : 500;
            const message = error.code === 'ER_DUP_ENTRY'
                ? t('workStatus:update.duplicateEntryName')
                : t('workStatus:update.serverError');

            throw {
                status: 'error',
                message,
                errorMessages,
                statusCode
            };
        }

        // Beklenmeyen hatalar
        throw {
            status: 'error',
            message: error.message || t('workStatus:update.serverError'),
            statusCode: 500,
            errorMessages: { general: error.message || t('workStatus:update.unknownError') }
        };
    }
};

const updateEntryInDatabase = async (entryId, updateData) => {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), entryId];

    const sql = `UPDATE user_company_entries SET ${setClause} WHERE id = ?`;
    await queryAsync(sql, values);
};

module.exports = updateEntry;
