/**
 * Dosya Yükleme İşleyici
 * Projedeki tüm dosya yükleme işlemleri için merkezi yönetim sağlar
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { uploadConfig, isValidExtension, isValidMimeType, isValidFileSize } = require('../config/uploadConfig');
const logError = require("../../utils/logger");
const { t } = require('../../config/i18nConfig');

/**
 * Geçici klasörün var olduğundan emin olur, yoksa oluşturur
 */
const ensureTempDirectory = async () => {
    const tempDir = uploadConfig.general.tempDirectory;
    try {
        await fs.access(tempDir);
    } catch {
        await fs.mkdir(tempDir, { recursive: true });
    }
};

/**
 * Hedef klasörün var olduğundan emin olur, yoksa oluşturur
 */
const ensureTargetDirectory = async (targetPath) => {
    const targetDir = path.dirname(targetPath);
    try {
        await fs.access(targetDir);
    } catch {
        await fs.mkdir(targetDir, { recursive: true });
    }
};

/**
 * Geçici dosyayı temizler
 */
const cleanupTempFile = async (tempFilePath) => {
    try {
        await fs.unlink(tempFilePath);
    } catch (error) {
        await logError(`Geçici dosya silinemedi: ${tempFilePath} - ${error.message}`);
    }
};

/**
 * Crypto kullanarak benzersiz dosya adı oluşturur
 */
const generateUniqueFileName = (originalName) => {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    return `${timestamp}_${randomHash}${ext}`;
};

/**
 * Dosya yükleme işlemini gerçekleştirir
 * @param {Array} files - Yüklenen dosya dizisi (multer'dan gelen)
 * @param {string} uploadType - Yükleme tipi (örn: 'receipt')
 * @param {string} targetSubDir - Hedef alt dizin (örn: 'receipts/2024/01')
 * @returns {Promise<Object>} - Yükleme sonuçları (uploadedFiles, failedFiles, totalUploaded, totalFailed)
 */
const handleFileUpload = async (files, uploadType, targetSubDir = '') => {
    // Boş array kontrolü
    if (!files || files.length === 0) {
        return {
            success: true,
            uploadedFiles: [],
            failedFiles: [],
            totalUploaded: 0,
            totalFailed: 0
        };
    }

    // uploadType kontrolü
    if (!uploadType) {
        throw {
            status: 400,
            message: t('errors:upload.missingUploadType')
        };
    }

    // uploadConfig'de bu tip var mı kontrol et
    if (!uploadConfig[uploadType]) {
        throw {
            status: 400,
            message: t('errors:upload.invalidUploadType')
        };
    }

    // Tek dosya işlemi için yardımcı fonksiyon
    const processSingleFile = async (file) => {
        let tempFilePath = null;

        try {
            // Dosya kontrolü
            if (!file) {
                throw {
                    status: 400,
                    message: t('errors:upload.noFile')
                };
            }

            if (file.size === 0) {
                throw {
                    status: 400,
                    message: t('errors:upload.emptyFile')
                };
            }

            // 1. Dosya uzantısı kontrolü
            if (!isValidExtension(file.originalname || file.name, uploadType)) {
                throw {
                    status: 400,
                    message: t('errors:upload.invalidFileType')
                };
            }

            // 2. MIME type kontrolü
            if (!isValidMimeType(file.mimetype, uploadType)) {
                throw {
                    status: 400,
                    message: t('errors:upload.invalidFileType')
                };
            }

            // 3. Dosya boyutu kontrolü
            if (!isValidFileSize(file.size, uploadType)) {
                throw {
                    status: 400,
                    message: t('errors:upload.fileSizeExceeded')
                };
            }

            // Geçici klasörü hazırla
            await ensureTempDirectory();

            // Benzersiz dosya adı oluştur
            const uniqueFileName = generateUniqueFileName(file.originalname || file.name);
            tempFilePath = path.join(uploadConfig.general.tempDirectory, uniqueFileName);

            // Dosyayı geçici klasöre kaydet
            // Eğer file.buffer varsa (memory storage)
            if (file.buffer) {
                await fs.writeFile(tempFilePath, file.buffer);
            }
            // Eğer file.path varsa (disk storage) - dosyayı taşı
            else if (file.path) {
                await fs.rename(file.path, tempFilePath);
            } else {
                throw {
                    status: 500,
                    message: t('errors:upload.uploadFailed')
                };
            }

            // Hedef yolu oluştur
            const targetDir = path.join(uploadConfig.general.uploadDirectory, uploadType, targetSubDir);
            const targetFilePath = path.join(targetDir, uniqueFileName);

            // Hedef klasörü hazırla
            await ensureTargetDirectory(targetFilePath);

            // Dosyayı hedef konuma taşı
            await fs.rename(tempFilePath, targetFilePath);

            // Başarılı sonuç döndür
            return {
                success: true,
                fileName: uniqueFileName,
                originalName: file.originalname || file.name,
                filePath: targetFilePath,
                relativePath: path.join(uploadType, targetSubDir, uniqueFileName),
                size: file.size,
                mimeType: file.mimetype,
                uploadType: uploadType
            };

        } catch (error) {
            // Hata durumunda geçici dosyayı temizle
            if (tempFilePath) {
                await cleanupTempFile(tempFilePath);
            }

            // Hatayı logla
            await logError(`Dosya yükleme hatası [${uploadType}]: ${error.message}`);

            // Hatayı fırlat
            throw error;
        }
    };

    const results = [];
    const errors = [];

    // Tüm dosyaları işle
    for (const file of files) {
        try {
            const result = await processSingleFile(file);
            results.push(result);
        } catch (error) {
            errors.push({
                fileName: file.originalname || file.name,
                error: error.message
            });
        }
    }

    // Eğer hiçbir dosya yüklenmediyse hata fırlat
    if (results.length === 0 && errors.length > 0) {
        throw {
            status: 400,
            message: t('errors:upload.allFilesFailed'),
            errors: errors
        };
    }

    return {
        success: true,
        uploadedFiles: results,
        failedFiles: errors,
        totalUploaded: results.length,
        totalFailed: errors.length
    };
};

/**
 * Yüklenen dosyayı siler
 * @param {string} filePath - Silinecek dosyanın yolu
 */
const deleteUploadedFile = async (filePath) => {
    try {
        const fullPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.join(uploadConfig.general.uploadDirectory, filePath);

        await fs.unlink(fullPath);
        return { success: true };
    } catch (error) {
        await logError(`Dosya silinemedi: ${filePath} - ${error.message}`);
        throw {
            status: 500,
            message: `Dosya silinemedi: ${error.message}`
        };
    }
};

module.exports = {
    cleanupTempFile,
    ensureTempDirectory,
    ensureTargetDirectory,
    handleFileUpload,
    deleteUploadedFile,
    generateUniqueFileName
};
