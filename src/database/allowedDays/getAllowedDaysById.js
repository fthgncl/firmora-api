const {queryAsync} = require('../utils/connection');
const {t} = require("../../config/i18n.config");
const {createToken} = require("../../auth/jwt");
const tablesConfig = require("../../config/tables.config");
const logError = require("../../utils/logger");

const getAllowedDaysById = async (allowedDayId, fields = null) => {
    if (!allowedDayId) {
        throw new Error(t('allowedDays:getId.allowedDayIdRequired'));
    }

    try {
        let sql;

        // Eğer fields belirtilmemişse tüm alanları çek
        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            sql = `SELECT * FROM user_allowed_days WHERE id = ?`;
        } else {
            // Transfer tablosunda tanımlı tüm geçerli alanları al
            const validTableFields = Object.keys(tablesConfig.user_allowed_days);

            // Talep edilen alanları doğrula
            const validFields = fields.filter(field => validTableFields.includes(field));
            const invalidFields = fields.filter(field => !validTableFields.includes(field));

            // Geçersiz alanları logla
            if (invalidFields.length > 0) {
                await logError(`${t('allowedDays:getId.invalidFieldsLog')}: ${invalidFields.join(', ')}`);
            }

            if (validFields.length === 0) {
                throw new Error(t('allowedDays:getId.validFieldsRequired'));
            }

            // SQL sorgusunu oluştur
            sql = `SELECT ${validFields.join(', ')} FROM transfers WHERE id = ?`;
        }

        const allowedDays = await queryAsync(sql, [allowedDayId]);
        if (!allowedDays || allowedDays.length === 0) {
            throw new Error(t('allowedDays:getId.notFound'));
        }

        const allowedDay = allowedDays[0];

        allowedDay.filesCount = allowedDay.files ? JSON.parse(allowedDay.files).length : 0;
        allowedDay.getFilesToken = createToken({allowedDayId: allowedDay.id}, process.env.FILE_DOWNLOAD_TOKEN_LIFETIME);

        return {
            status: 'success',
            allowedDay: allowedDay
        }

    } catch (error) {
        return {
            status: 'error',
            message: error.message
        }
    }
};

module.exports = getAllowedDaysById;