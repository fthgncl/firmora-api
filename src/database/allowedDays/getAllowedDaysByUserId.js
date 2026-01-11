const {queryAsync} = require('../utils/connection');
const {t} = require("../../config/i18n.config");
const {createToken} = require("../../auth/jwt");

const getAllowedDaysByUserId = async (userId, startDate = null, endDate = null) => {
    if (!userId) {
        throw new Error(t('allowedDays:getByUserId.userIdRequired'));
    }

    try {
        let sql = `SELECT * FROM user_allowed_days WHERE user_id = ?`;
        const params = [userId];

        if (startDate && endDate) {
            sql += ` AND start_date >= ? AND end_date <= ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` AND start_date >= ?`;
            params.push(startDate);
        } else if (endDate) {
            sql += ` AND end_date <= ?`;
            params.push(endDate);
        }

        const allowedDays = await queryAsync(sql, params);

        const processedAllowedDays = allowedDays.map(day => {
            const filesCount = day.files ? JSON.parse(day.files).length : 0;
            const getFilesToken = createToken({allowedDayId: day.id}, process.env.FILE_DOWNLOAD_TOKEN_LIFETIME );

            delete day.files;
            return {
                ...day,
                filesCount,
                getFilesToken
            }
        });

        return {
            status: 'success',
            allowedDays: processedAllowedDays
        }

    } catch (error) {
        return {
            status: 'error',
            message: error.message
        }
    }
};

module.exports = getAllowedDaysByUserId;