const { queryAsync } = require('../utils/connection');
const { t } = require('../../config/i18n.config');
const getCompanyById = require('./getCompanyById');
const {cleanInputs} = require("../../utils/inputCleaner");

const getErrorMessages = (error) => {
    const errorMessages = {};
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('company_name')) {
            errorMessages.company_name = t('companies:update.duplicateCompanyName');
        }
    } else {
        errorMessages.general = t('companies:update.unknownError');
    }
    return errorMessages;
};

const updateCompany = async (companyId, updateData) => {
    try {
        // Şirketin var olup olmadığını kontrol et
        const existingCompany = await getCompanyById(companyId, ['id']);
        if (!existingCompany) {
            throw {
                status: 'error',
                message: t('companies:update.notFound'),
                statusCode: 404,
                errorMessages: { general: t('companies:update.notFound') }
            };
        }

        const processedData = await prepareUpdateData(updateData);

        if (Object.keys(processedData).length === 0) {
            throw {
                status: 'error',
                message: t('companies:update.noValidFields'),
                statusCode: 400,
                errorMessages: { general: t('companies:update.noValidFields') }
            };
        }

        // Veritabanında güncelle
        await updateCompanyInDatabase(companyId, processedData);

        return {
            status: 'success',
            message: t('companies:update.success'),
            updatedFields: processedData
        };
    } catch (error) {

        // Veritabanı hatalarını ele al
        const errorMessages = getErrorMessages(error);
        const statusCode = error.code === 'ER_DUP_ENTRY' ? 400 : 500;
        const message = error.code === 'ER_DUP_ENTRY'
            ? t('companies:update.duplicateCompanyName')
            : t('companies:update.serverError');

        throw { status: 'error', message, errorMessages, statusCode };
    }
};

const prepareUpdateData = async (updateData) => {
    const allowedFields = ['company_name', 'sector'];
    const processedData = {};

    // Sadece izin verilen alanları işle
    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined && value !== null) {
            processedData[key] = value;
        }
    }
    return cleanInputs(processedData);
};

const updateCompanyInDatabase = async (companyId, updateData) => {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), companyId];

    const sql = `UPDATE companies SET ${setClause} WHERE id = ?`;
    await queryAsync(sql, values);
};

module.exports = updateCompany;
