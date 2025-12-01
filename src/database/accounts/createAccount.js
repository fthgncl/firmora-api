const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const { t } = require('../../config/i18n.config');

const createAccount = async (accountData) => {
    try {
        const accountId = await generateUniqueId('ACC', 'user_accounts');
        const processedAccountData = await prepareAccountData(accountData, accountId);
        await insertAccountToDatabase(processedAccountData);

        return {
            status: 'success',
            message: t('accounts.create.success'),
            account: {
                id: accountId,
                user_id: processedAccountData.user_id,
                company_id: processedAccountData.company_id,
                currency: processedAccountData.currency,
                balance: processedAccountData.balance
            }
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('accounts.create.error')} - ${error.message}`;
        }
        throw error;
    }
};

const prepareAccountData = async (accountData, accountId) => {
    const processedData = {
        ...accountData,
        id: accountId,
        balance: accountData.balance || 0
    };

    // Currency büyük harfe çevir
    if (accountData.currency) {
        processedData.currency = accountData.currency.toUpperCase();
    }

    return processedData;
};

const insertAccountToDatabase = async (accountData) => {
    const columns = Object.keys(accountData).join(", ");
    const values = Object.values(accountData);
    const placeholders = values.map(() => '?').join(", ");

    const sql = `INSERT INTO user_accounts (${columns}) VALUES (${placeholders})`;
    await queryAsync(sql, values);
};

module.exports = createAccount;