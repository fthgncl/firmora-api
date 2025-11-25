const {queryAsync} = require('../utils/connection');
const {t} = require('../../config/i18nConfig');
const {cleanInputs} = require("../../utils/inputCleaner");
const bcrypt = require("bcryptjs");

const updateUser = async (userId, userData) => {
    try {
        const processedUserData = await cleanInputs(userData);
        await updateUserInDatabase(userId, processedUserData);
        delete processedUserData.password;

        return {
            status: 'success',
            message: t('users:update.success'),
            user: {id: userId, ...processedUserData}
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('users:update.error')} - ${error.message}`;
        }
        throw error;
    }
};

const updateUserInDatabase = async (userId, userData) => {

    if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
    }

    const updates = Object.keys(userData).map(key => `${key} = ?`).join(", ");
    const values = [...Object.values(userData), userId];

    const sql = `UPDATE users
                 SET ${updates}
                 WHERE id = ?`;
    await queryAsync(sql, values);
};

module.exports = updateUser;
