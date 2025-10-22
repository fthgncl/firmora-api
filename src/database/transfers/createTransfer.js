const {queryAsync} = require('../utils/connection');
const {generateUniqueId} = require('../../utils/idUtils');
const {t} = require('../../config/i18nConfig');
const {checkUserRoles} = require('../../utils/permissionsManager');
const {
    getCompanyCurrency,
    getUserAccountCurrency,
    validateUserInCompany,
    validateAmount,
    validateCompanyBalance
} = require("../utils/validators");
const {deductCompanyBalance, addCompanyBalance, getCompanyById} = require("../companies");
const {addAccountBalance, deductAccountBalance, getAccountsByUserId} = require("../accounts");

const createTransfer = async (transferData, userId, companyId) => {

    const {transfer_type, currency} = transferData;

    if (!transfer_type) {
        throw new Error(t('errors:transfer.transfer_type_required'));
    }

    if (!currency) {
        throw new Error(t('errors:transfer.currency_required'));
    }

    await calculateFinalBalances(transferData, userId, companyId)

    console.log(transferData);

    transferData.id = await generateUniqueId('TRF', 'transfers');
    transferData.user_id = userId;
    transferData.company_id = companyId;

    try {
        await queryAsync('START TRANSACTION');

        // Transfer tipine göre ilgili fonksiyona yönlendir
        let result;
        switch (transfer_type) {
            case 'company_to_user_same':
                result = await handleCompanyToUserSame(transferData);
                break;

            case 'company_to_user_other':
                result = await handleCompanyToUserOther(transferData);
                break;

            case 'company_to_company_other':
                result = await handleCompanyToCompanyOther(transferData);
                break;

            case 'user_to_user_same':
                result = await handleUserToUserSame(transferData);
                break;

            case 'user_to_user_other':
                result = await handleUserToUserOther(transferData);
                break;

            case 'user_to_company_same':
                result = await handleUserToCompanySame(transferData);
                break;

            case 'user_to_company_other':
                result = await handleUserToCompanyOther(transferData);
                break;

            case 'user_to_external':
                result = await handleUserToExternal(transferData);
                break;

            case 'company_to_external':
                result = await handleCompanyToExternal(transferData);
                break;

            case 'external_to_user':
                result = await handleExternalToUser(transferData);
                break;

            case 'external_to_company':
                result = await handleExternalToCompany(transferData);
                break;

            default:
                throw new Error(t('errors:transfer.invalid_transfer_type'));
        }


        // İşlem başarılı, commit yap
        await queryAsync('COMMIT');
        return result;

    } catch (error) {
        // Hata durumunda rollback yap
        await queryAsync('ROLLBACK');
        throw error;
    }
};

async function calculateFinalBalances(transferData, userId, companyId) {
    let fromCurrentBalance = null;
    if (transferData.from_scope === 'company') {
        fromCurrentBalance = await getCompanyById(companyId, ['balance']);
    } else if (transferData.from_scope === 'user') {
        const {accounts} = await getAccountsByUserId(userId, ['balance'], companyId)
        fromCurrentBalance = accounts.length > 0 ? accounts[0].balance : null;
    }
    transferData.sender_final_balance = fromCurrentBalance == null ? null : fromCurrentBalance - transferData.amount;

    let toCurrentBalance = null;
    if (transferData.to_scope === 'company' && transferData.to_user_company_id) {
        toCurrentBalance = await getCompanyById(transferData.to_user_company_id, ['balance']);
    } else if (transferData.to_scope === 'user' && transferData.to_user_id) {
        const targetCompanyId = transferData.to_user_company_id || companyId;
        const {accounts} = await getAccountsByUserId(transferData.to_user_id, ['balance'], targetCompanyId);
        toCurrentBalance = accounts.length > 0 ? accounts[0].balance : null;
    }
    transferData.receiver_final_balance = toCurrentBalance == null ? null : toCurrentBalance + transferData.amount;
}

// Handler fonksiyonları
async function handleCompanyToUserSame(transferData) {
    // Firma hesabından aynı firmadaki bir kullanıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_same_company_user']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'company' || to_scope !== 'user') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors:transfer.to_user_id_required'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getUserAccountCurrency(to_user_id, company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, company_id);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addAccountBalance(to_user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            to_user_id,
            company_id, // aynı firma olduğu için
            from_scope,
            to_scope,
            amount,
            currency,
            'company_to_user_same',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleCompanyToUserOther(transferData) {
    // Firma hesabından başka firmadaki bir kullanıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_other_company_user']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_id, to_user_company_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'company' || to_scope !== 'user') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors:transfer.to_user_id_required'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors:transfer.to_user_company_id_required'));
        }

        if (company_id === to_user_company_id) {
            throw new Error(t('errors:transfer.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getUserAccountCurrency(to_user_id, to_user_company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, to_user_company_id);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addAccountBalance(to_user_id, to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            to_user_id,
            to_user_company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'company_to_user_other',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleCompanyToCompanyOther(transferData) {
    // Firma hesabından başka bir firmaya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_other_company']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_company_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'company' || to_scope !== 'company') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors:transfer.to_user_company_id_required'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors:transfer.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getCompanyCurrency(to_user_company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addCompanyBalance(to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, firma-firma transferi
            to_user_company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'company_to_company_other',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleUserToUserSame(transferData) {
    // Kullanıcı hesabından aynı firmadaki başka bir kullanıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_same_company_user']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'user' || to_scope !== 'user') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors:transfer.to_user_id_required'));
        }

        // Aynı kullanıcıya transfer yapılamaz
        if (user_id === to_user_id) {
            throw new Error(t('errors:transfer.cannot_transfer_to_self'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getUserAccountCurrency(to_user_id, company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, company_id);

        // Gönderen kullanıcının yeterli bakiyesi var mı kontrol et (deductAccountBalance içinde kontrol ediliyor)
        await deductAccountBalance(user_id, company_id, amount);
        await addAccountBalance(to_user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            to_user_id,
            company_id, // aynı firma olduğu için
            from_scope,
            to_scope,
            amount,
            currency,
            'user_to_user_same',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleUserToUserOther(transferData) {
    // Kullanıcı hesabından başka firmadaki bir kullanıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_other_company_user']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_id, to_user_company_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'user' || to_scope !== 'user') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors:transfer.to_user_id_required'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors:transfer.to_user_company_id_required'));
        }

        // Aynı kullanıcıya transfer yapılamaz
        if (user_id === to_user_id) {
            throw new Error(t('errors:transfer.cannot_transfer_to_self'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors:transfer.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getUserAccountCurrency(to_user_id, to_user_company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, to_user_company_id);

        await deductAccountBalance(user_id, company_id, amount);
        await addAccountBalance(to_user_id, to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            to_user_id,
            to_user_company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'user_to_user_other',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleUserToCompanySame(transferData) {
    // Kullanıcı hesabından kendi firmasına transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_own_company']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'user' || to_scope !== 'company') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getCompanyCurrency(company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);

        await deductAccountBalance(user_id, company_id, amount);
        await addCompanyBalance(company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, kullanıcı-firma transferi
            company_id, // kendi firmasına
            from_scope,
            to_scope,
            amount,
            currency,
            'user_to_company_same',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleUserToCompanyOther(transferData) {
    // Kullanıcı hesabından başka firmaya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_other_company']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_company_id, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'user' || to_scope !== 'company') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors:transfer.to_user_company_id_required'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors:transfer.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getCompanyCurrency(to_user_company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);

        await deductAccountBalance(user_id, company_id, amount);
        await addCompanyBalance(to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, description, status, 
                                   sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, kullanıcı-firma transferi
            to_user_company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'user_to_company_other',
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleUserToExternal(transferData) {
    // Kullanıcı hesabından sistem dışı bir alıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_external']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_external_name, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'user' || to_scope !== 'external') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_external_name || to_external_name.trim().length === 0) {
            throw new Error(t('errors:transfer.to_external_name_required'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);

        // Kullanıcı hesabından bakiye düş (sistem dışı transfer, alıcı tarafta işlem yok)
        await deductAccountBalance(user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, to_external_name, description,
                                   status, sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, external transfer
            null, // to_user_company_id yok, external transfer
            from_scope,
            to_scope,
            amount,
            currency,
            'user_to_external',
            to_external_name,
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleCompanyToExternal(transferData) {
    // Firma hesabından sistem dışı bir alıcıya transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_external']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_external_name, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'company' || to_scope !== 'external') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_external_name || to_external_name.trim().length === 0) {
            throw new Error(t('errors:transfer.to_external_name_required'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateCompanyBalance(company_id, amount);

        // Firma hesabından bakiye düş (sistem dışı transfer, alıcı tarafta işlem yok)
        await deductCompanyBalance(company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, to_external_name, description,
                                   status, sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, external transfer
            null, // to_user_company_id yok, external transfer
            from_scope,
            to_scope,
            amount,
            currency,
            'company_to_external',
            to_external_name,
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleExternalToUser(transferData) {
    // Sistem dışı kaynaktan kullanıcı hesabına transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_receive_external_to_user']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {to_user_id, from_external_name, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'external' || to_scope !== 'user') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors:transfer.to_user_id_required'));
        }

        if (!from_external_name || from_external_name.trim().length === 0) {
            throw new Error(t('errors:transfer.from_external_name_required'));
        }

        if (!currency || currency !== await getUserAccountCurrency(to_user_id, company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, company_id);

        // Kullanıcı hesabına bakiye ekle (sistem dışı giriş, kaynak tarafta işlem yok)
        await addAccountBalance(to_user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, from_external_name,
                                   description, status, sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            to_user_id,
            company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'external_to_user',
            from_external_name,
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

async function handleExternalToCompany(transferData) {
    // Sistem dışı kaynaktan firma hesabına transfer

    try {
        const {user_id, company_id} = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_receive_external_to_company']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.insufficientPermissions'));

        }

        const {from_external_name, from_scope, to_scope, amount, currency} = transferData;
        if (from_scope !== 'external' || to_scope !== 'company') {
            throw new Error(t('errors:transfer.invalid_scopes_for_transfer_type'));
        }

        if (!from_external_name || from_external_name.trim().length === 0) {
            throw new Error(t('errors:transfer.from_external_name_required'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id)) {
            throw new Error(t('errors:transfer.invalid_currency'));
        }

        validateAmount(amount);

        // Firma hesabına bakiye ekle (sistem dışı giriş, kaynak tarafta işlem yok)
        await addCompanyBalance(company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (id, user_id, company_id, to_user_id, to_user_company_id,
                                   from_scope, to_scope, amount, currency, transfer_type, from_external_name,
                                   description, status, sender_final_balance, receiver_final_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
        `;

        await queryAsync(insertQuery, [
            transferData.id,
            user_id,
            company_id,
            null, // to_user_id yok, firmaya giriş
            company_id,
            from_scope,
            to_scope,
            amount,
            currency,
            'external_to_company',
            from_external_name,
            transferData.description || null,
            transferData.sender_final_balance,
            transferData.receiver_final_balance
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers:create.success')
        };

    } catch (error) {
        const errorMessage = error.message || t('transfers:create.failed');
        const errorStatus = error.message ? 400 : 500;

        const err = new Error(errorMessage);
        err.status = errorStatus;
        throw err;
    }
}

module.exports = createTransfer;