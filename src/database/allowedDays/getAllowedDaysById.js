const {queryAsync} = require('../utils/connection');
const {t} = require("../../config/i18n.config");
const {createToken} = require("../../auth/jwt");

const getAllowedDaysById = async (allowedDayId) => {
    if (!allowedDayId) {
        throw new Error(t('allowedDays:getId.allowedDayIdRequired'));
    }

    try {
        let sql = `SELECT *
                     FROM user_allowed_days
                     WHERE id = ?`;
        const params = [allowedDayId];

        const allowedDays = await queryAsync(sql, params);
        const allowedDay = allowedDays[0];

        allowedDay.filesCount = allowedDay.files ? JSON.parse(allowedDay.files).length : 0;
        allowedDay.getFilesToken = createToken({allowedDayId: allowedDay.id}, process.env.FILE_DOWNLOAD_TOKEN_LIFETIME);
        delete allowedDay.files;

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