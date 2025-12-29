const {t} = require("../../config/i18n.config");
const getAccountsByUserId = require("./getAccountsByUserId");


function getWorkingStatus(userId, companyId = null) {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await getAccountsByUserId(userId, ['id', 'is_working', 'last_worked_at'], companyId);

            if (!result || !result.accounts || result.accounts.length === 0) {
                throw new Error(t('accounts:workingStatus.accountsNotFound'));
            }

            const accounts = result.accounts.map(account => ({
                accountId: account.id,
                isWorking: account.is_working,
                lastWorkedAt: account.is_working ? new Date() : account.last_worked_at
            }));

            resolve({
                status: 'success',
                accounts
            });

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = getWorkingStatus;
