const {queryAsync} = require('../utils/connection');
const {t} = require("../../config/i18n.config");
const {createToken} = require("../../auth/jwt");

const getAllowedDaysByUserId = async (allowedDayId) => {
    if (!allowedDayId) {
        throw new Error(t('allowedDays:getId.allowedDayIdRequired'));
    }

    try {
        const sql = `SELECT *
                     FROM user_allowed_days
                     WHERE id = ?`;
        const allowedDays = await queryAsync(sql, [allowedDayId]);

        if (allowedDays.length === 0) {
            throw new Error(t('allowedDays:getId.noAllowedDaysFound'));
        }

        const allowedDay = allowedDays[0];

        allowedDay.filesCount = allowedDay.files ? JSON.parse(allowedDay.files).length : 0;
        allowedDay.getFilesToken = createToken({allowedDayId: allowedDay.id}, process.env.FILE_DOWNLOAD_TOKEN_LIFETIME);
        delete allowedDay.files;
        return allowedDay;


    } catch (error) {
        throw new Error(t('allowedDays:getId.queryError', {error: error.message}));
    }
};

module.exports = getAllowedDaysByUserId;