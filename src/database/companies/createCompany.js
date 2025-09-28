const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const capitalizeFirstLetters = require('../../utils/capitalizeFirstLetters');
const { t } = require('../../config/i18nConfig');

const createCompany = async (companyData) => {
    try {
        const companyId = await generateUniqueId('COM', 'companies');
        const processedCompanyData = await prepareCompanyData(companyData, companyId);
        await insertCompanyToDatabase(processedCompanyData);

        return {
            status: 'success',
            message: t('companies.create.success'),
            company: {
                id: companyId,
                company_name: processedCompanyData.company_name,
                sector: processedCompanyData.sector,
                currency: processedCompanyData.currency,
                owner_id: processedCompanyData.owner_id
            }
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('companies.create.error')} - ${error.message}`;
        }
        throw error;
    }
};

const prepareCompanyData = async (companyData, companyId) => {
    const processedData = {
        ...companyData,
        id: companyId,
        company_name: capitalizeFirstLetters(companyData.company_name),
    };

    // Sector varsa capitalize et
    if (companyData.sector) {
        processedData.sector = capitalizeFirstLetters(companyData.sector);
    }

    // Currency büyük harfe çevir
    if (companyData.currency) {
        processedData.currency = companyData.currency.toUpperCase();
    }

    return processedData;
};

const insertCompanyToDatabase = async (companyData) => {
    const columns = Object.keys(companyData).join(", ");
    const values = Object.values(companyData);
    const placeholders = values.map(() => '?').join(", ");

    const sql = `INSERT INTO companies (${columns}) VALUES (${placeholders})`;
    await queryAsync(sql, values);
};

module.exports = createCompany;
