const {t} = require("../../config/i18n.config");
const {getAccountsByUserId} = require("./index");


function getWorkingStatus(userId, companyId) {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await getAccountsByUserId(userId, ['id', 'is_working', 'last_worked_at'], companyId);

            if (!result || !result.accounts || result.accounts.length === 0) {
                throw new Error(t('accounts:workingStatus.accountsNotFound'));
            }

            const account = result.accounts[0];

            resolve({
                status: 'success',
                data: {
                    accountId: account.id,
                    isWorking: account.is_working,
                    lastWorkedAt: account.is_working ? new Date() : account.last_worked_at
                }
            });

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = getWorkingStatus;
