/**
 * Dosya Yükleme Yapılandırması
 * Bu dosya, sistemdeki dosya yükleme işlemleri için gerekli yapılandırmaları içerir
 */

const uploadConfig = {
    // Dekont yükleme ayarları
    receipt: {
        // Maksimum dosya boyutu (byte cinsinden) - 5MB
        maxFileSize: 5 * 1024 * 1024,

        // Maksimum dosya sayısı
        maxFileCount: 5,

        // Desteklenen dosya uzantıları
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],

        // İzin verilen MIME türleri
        allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf'
        ],

    },

    // Genel ayarlar
    general: {
        // Yükleme dizini
        uploadDirectory: './uploads',

        // Geçici dosya dizini
        tempDirectory: './uploads/temp'
    }
};

/**
 * Dosya uzantısının izin verilen listede olup olmadığını kontrol eder
 * @param {string} filename - Dosya adı
 * @param {string} type - Yükleme tipi (örn: 'receipt')
 * @returns {boolean}
 */
const isValidExtension = (filename, type = 'receipt') => {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return uploadConfig[type].allowedExtensions.includes(ext);
};

/**
 * MIME türünün izin verilen listede olup olmadığını kontrol eder
 * @param {string} mimetype - MIME türü
 * @param {string} type - Yükleme tipi (örn: 'receipt')
 * @returns {boolean}
 */
const isValidMimeType = (mimetype, type = 'receipt') => {
    return uploadConfig[type].allowedMimeTypes.includes(mimetype);
};

/**
 * Dosya boyutunun izin verilen limiti aşıp aşmadığını kontrol eder
 * @param {number} fileSize - Dosya boyutu (byte)
 * @param {string} type - Yükleme tipi (örn: 'receipt')
 * @returns {boolean}
 */
const isValidFileSize = (fileSize, type = 'receipt') => {
    return fileSize <= uploadConfig[type].maxFileSize;
};

module.exports = {
    uploadConfig,
    isValidExtension,
    isValidMimeType,
    isValidFileSize
};
