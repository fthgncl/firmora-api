const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18n.config");
const getWorkingStatus = require("./getWorkingStatus");
const updateAccount = require("./updateAccount");


function setWorkingStatus(userId, companyId, isWorking) {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof isWorking !== 'boolean') {
                throw new Error('isWorking must be a boolean value.');
            }

            const { data } = await getWorkingStatus(userId, companyId);

            if (data.is_working === isWorking) {
                return resolve({
                    status: 'success',
                    message: t('accounts:workingStatus.noChange', {status: isWorking ? t('accounts:workingStatus.working') : t('accounts:workingStatus.notWorking')}),
                });
            }

            const updateData = {is_working: isWorking};

            if ( isWorking === false ) {
                updateData.last_worked_at = new Date();
            }

            await updateAccount(data.accountId, updateData)
                .then((result) => {
                    resolve({
                        ...result,
                        status: 'success',
                        message: t('accounts:workingStatus.success', {status: isWorking ? t('accounts:workingStatus.working') : t('accounts:workingStatus.notWorking')}),

                    });
                })
                .catch((error) => {
                    throw error;
                })

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = setWorkingStatus;