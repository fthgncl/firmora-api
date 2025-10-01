const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const capitalizeFirstLetters = require('../../utils/capitalizeFirstLetters');
const bcrypt = require('bcryptjs');
const { t } = require('../../config/i18nConfig');

const createUser = async (userData) => {
    try {
        const userId = await generateUniqueId('USR', 'users');
        const processedUserData = await prepareUserData(userData, userId);
        await insertUserToDatabase(processedUserData);

        const { password, ...userWithoutPassword } = processedUserData;

        return {
            status: 'success',
            message: t('users.create.success'),
            user: userWithoutPassword
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('users.create.error')} - ${error.message}`;
        }
        throw error;
    }
};

const prepareUserData = async (userData, userId) => {
    const processedData = { // TODO: Burada telefon numarası ve yetki düzeltmesi yapılabilir.
        ...userData,
        id: userId,
        name: capitalizeFirstLetters(userData.name),
        surname: capitalizeFirstLetters(userData.surname)
    };

    if (userData.password) {
        processedData.password = await bcrypt.hash(userData.password, 10);
    }

    return processedData;
};

const insertUserToDatabase = async (userData) => {
    const columns = Object.keys(userData).join(", ");
    const values = Object.values(userData);
    const placeholders = values.map(() => '?').join(", ");

    const sql = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
    await queryAsync(sql, values);
};

module.exports = createUser;
