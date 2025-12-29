const {queryAsync} = require('../utils/connection');
const {t} = require('../../config/i18n.config');
const {cleanInputs} = require("../../utils/inputCleaner");

const updateAccount = async (accountId, accountData) => {
    try {
        const processedAccountData = await cleanInputs(accountData);

        if (Object.keys(processedAccountData).length === 0) {
            return {
                status: 'success',
                message: t('accounts:update.success'),
                account: processedAccountData
            };
        }

        await updateAccountInDatabase(accountId, processedAccountData);

        return {
            status: 'success',
            message: t('accounts:update.success'),
            account: {id: accountId, ...processedAccountData}
        };
    } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
            error.message = `${t('accounts:update.error')} - ${error.message}`;
        }
        throw error;
    }
};

const updateAccountInDatabase = async (accountId, accountData) => {
    const updates = Object.keys(accountData).map(key => `${key} = ?`).join(", ");
    const values = [...Object.values(accountData), accountId];

    const sql = `UPDATE user_accounts
                 SET ${updates}
                 WHERE id = ?`;
    await queryAsync(sql, values);
};

module.exports = updateAccount;
