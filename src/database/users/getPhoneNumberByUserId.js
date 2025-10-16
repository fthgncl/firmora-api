const getUserById = require('./getUserById');
const { t } = require('../../config/i18nConfig');

/**
 * Kullanıcı ID'si ile telefon numarasını getirme fonksiyonu
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<string>} Telefon numarası
 * @throws {Error} Kullanıcı bulunamadığında veya telefon numarası yoksa
 */
const getPhoneNumberByUserId = async (userId) => {
    const userInfo = await getUserById(userId, ['phone']);

    if (!userInfo) {
        throw new Error(t('users:getPhoneNumberByUserId.userNotFound'));
    }

    if (!userInfo.phone) {
        throw new Error(t('users:getPhoneNumberByUserId.phoneNotRegistered'));
    }

    return userInfo.phone;
};

module.exports = getPhoneNumberByUserId;
