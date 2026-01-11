const {queryAsync} = require('../utils/connection');
const {t} = require("../../config/i18n.config");
const {createToken} = require("../../auth/jwt");

const getAllowedDaysByUserId = async (userId) => {
    if (!userId) {
        throw new Error(t('allowedDays:getByUserId.userIdRequired'));
    }

    try {
        const sql = `SELECT * FROM user_allowed_days WHERE user_id = ?`;
        const allowedDays = await queryAsync(sql, [userId]);

        if (allowedDays.length === 0) {
            throw new Error(t('allowedDays:getByUserId.noAllowedDaysFound'));
        }


        return allowedDays.map(day => {
            const filesCount = day.files ? JSON.parse(day.files).length : 0;
            const getFilesToken = createToken({allowedDayId: day.id}, process.env.FILE_DOWNLOAD_TOKEN_LIFETIME );

            delete day.files;
            return {
                ...day,
                filesCount,
                getFilesToken
            }
        });

    } catch (error) {
        throw new Error(t('allowedDays:getByUserId.queryError', {error: error.message}));
    }
};

module.exports = getAllowedDaysByUserId;