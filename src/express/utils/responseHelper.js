/**
 * HTTP Yanıt Yardımcısı
 * Standart API yanıtları oluşturmak için yardımcı fonksiyonlar
 */

const logError = require("../../utils/logger");
const { t } = require("../../config/i18nConfig");

/**
 * Başarılı yanıt döndürür (HTTP 200)
 * @param {Object} res - Express yanıt nesnesi
 * @param {Object} data - Yanıt verileri
 * @param {number} statusCode - HTTP durum kodu (varsayılan: 200)
 * @returns {Object} HTTP yanıtı
 */
function success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        status: 'success',
        ...data
    });
}

/**
 * Hata yanıtı döndürür
 * @param {Object} res - Express yanıt nesnesi
 * @param {string} message - Hata mesajı
 * @param {number} statusCode - HTTP durum kodu (varsayılan: 400)
 * @param {Object} additionalData - Eklenecek ek veriler
 * @returns {Object} HTTP yanıtı
 */
function error(res, message, statusCode = 400, additionalData = {}) {
    return res.status(statusCode).json({
        status: 'error',
        message,
        ...additionalData
    });
}

/**
 * Sunucu hatası yanıtı döndürür (HTTP 500)
 * @param {Object} res - Express yanıt nesnesi
 * @param {Error} error - Hata nesnesi
 * @returns {Object} HTTP yanıtı
 */
async function serverError(res, error) {
    await logError(error.message, error);
    return res.status(500).json({
        status: 'error',
        message: t('errors:responses.serverError'),
        error: error.message || t('errors:responses.unknownError')
    });
}

module.exports = {
    success,
    error,
    serverError
};