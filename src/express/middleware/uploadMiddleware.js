const multer = require('multer');
const responseHelper = require('../utils/responseHelper');
const { t } = require('../../config/i18n.config');

const upload = multer({ dest: 'uploads/' });

/**
 * Dosya yükleme middleware'i
 * @param {number} maxFileCount - Maksimum yüklenebilecek dosya sayısı
 * @param fieldName
 * @returns {Function} Express middleware fonksiyonu
 */
const uploadMiddleware = (maxFileCount, fieldName = 'attachments') => {
    return (req, res, next) => {
        upload.array(fieldName, maxFileCount)(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                    // Buraya geldiğinde fazladan dosya gönderilmiş demektir
                    return responseHelper.error(
                        res,
                        t('errors:upload.maxFileCountExceeded', { maxCount: maxFileCount }),
                        400
                    );
                }

                return responseHelper.serverError(res, err);
            }

            next();
        });
    };
};

module.exports = uploadMiddleware;
