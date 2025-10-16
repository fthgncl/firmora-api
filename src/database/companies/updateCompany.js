const { queryAsync } = require('../utils/connection');
const capitalizeFirstLetters = require('../../utils/capitalizeFirstLetters');
const { t } = require('../../config/i18nConfig');
const getCompanyById = require('./getCompanyById');

/**
 * Şirket bilgilerini günceller
 * @param {string} companyId - Güncellenecek şirket ID
 * @param {object} updateData - Güncellenecek veriler
 * @returns {Promise<object>} Güncelleme sonucu
 */
const updateCompany = async (companyId, updateData) => {
    try {
        // Şirketin var olup olmadığını kontrol et
        const existingCompany = await getCompanyById(companyId, ['id']);
        if (!existingCompany) {
            throw new Error(t('companies:update.notFound'));
        }

        // Güncelleme verilerini hazırla
        const processedData = await prepareUpdateData(updateData);

        if (Object.keys(processedData).length === 0) {
            throw new Error(t('companies:update.noValidFields'));
        }

        // Veritabanında güncelle
        await updateCompanyInDatabase(companyId, processedData);

        return {
            status: 'success',
            message: t('companies:update.success'),
            companyId
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('companies:update.error')} - ${error.message}`;
        }
        throw error;
    }
};

const prepareUpdateData = async (updateData) => {
    const allowedFields = ['company_name', 'sector', 'currency'];
    const processedData = {};

    // Sadece izin verilen alanları işle
    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined && value !== null) {
            if (key === 'company_name') {
                processedData[key] = capitalizeFirstLetters(value);
            } else if (key === 'sector' && value.trim() !== '') {
                processedData[key] = capitalizeFirstLetters(value);
            } else if (key === 'currency') {
                processedData[key] = value.toUpperCase();
            }
        }
    }

    return processedData;
};

const updateCompanyInDatabase = async (companyId, updateData) => {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), companyId];

    const sql = `UPDATE companies SET ${setClause} WHERE id = ?`;
    await queryAsync(sql, values);
};

module.exports = updateCompany;
