const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const {t} = require("../../config/i18n.config");
const {getAccountsByUserId} = require("../accounts");

const createEntry = async (userId, companyId, entryType, note = null) => {

    if (!userId || !companyId || !entryType) {
        throw new Error(t('turnstile:scan.missingRequiredFields', {fields: 'userId, companyId, entryType'}));
    }

    if( entryType !== 'entry' && entryType !== 'exit' ){
        throw new Error(t('turnstile:scan.invalidEntryType', {validTypes: 'entry, exit'}));
    }

    if (note && typeof note !== 'string'){
        throw new Error(t('turnstile:scan.noteMustBeString'));
    }

    if( note && note.length > 255 ){
        throw new Error(t('turnstile:scan.noteTooLong', {maxLength: 255}));
    }


    try {

        const { accounts } = await getAccountsByUserId(userId,['company_id'], companyId);
        const isUserInCompany = accounts.some(acc => acc.company.id === companyId);

        if ( !isUserInCompany ) {
            throw new Error(t('turnstile:scan.userNotInCompany'));
        }


        const entryId = await generateUniqueId('ENT', 'user_company_entries');
        const sql = `INSERT INTO user_company_entries (id, user_id, company_id, entry_type, note) VALUES (?, ?, ?, ?, ?)`;
        await queryAsync(sql, [entryId, userId, companyId, entryType, note]);

        return {
            status: 'success',
            entry: {
                id: entryId,
                user_id: userId,
                company_id: companyId,
                entry_type: entryType,
                note: note
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = createEntry;
