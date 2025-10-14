const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');
const { t } = require('../../config/i18nConfig');
const { checkUserRoles } = require('../../utils/permissionsManager');
const {getCompanyCurrency, getUserAccountCurrency, validateUserInCompany, validateAmount, validateCompanyBalance} = require("../utils/validators");
const {deductCompanyBalance, addCompanyBalance} = require("../companies");
const {addAccountBalance, deductAccountBalance} = require("../accounts");

const createTransfer = async (transferData, userId, companyId) => {

    const { transfer_type, currency } = transferData;

    if (!transfer_type) {
        throw new Error(t('errors.transfer_type_required'));
    }

    if (!currency){
        throw new Error(t('errors.currency_required'));
    }


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

            default:
                throw new Error(t('errors.invalid_transfer_type'));
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

// Handler fonksiyonları
async function handleCompanyToUserSame(transferData) {
    // Firma hesabından aynı firmadaki bir kullanıcıya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_same_company_user']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'company' || to_scope !== 'user') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors.to_user_id_required'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getUserAccountCurrency(to_user_id, company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, company_id);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addAccountBalance(to_user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'company_to_user_same'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleCompanyToUserOther(transferData) {
    // Firma hesabından başka firmadaki bir kullanıcıya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_other_company_user']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_id, to_user_company_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'company' || to_scope !== 'user') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors.to_user_id_required'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors.to_user_company_id_required'));
        }

        if (company_id === to_user_company_id) {
            throw new Error(t('errors.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getUserAccountCurrency(to_user_id, to_user_company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, to_user_company_id);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addAccountBalance(to_user_id, to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'company_to_user_other'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleCompanyToCompanyOther(transferData) {
    // Firma hesabından başka bir firmaya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_company_to_other_company']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_company_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'company' || to_scope !== 'company') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors.to_user_company_id_required'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getCompanyCurrency(company_id) || currency !== await getCompanyCurrency(to_user_company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);
        await validateCompanyBalance(company_id, amount);

        await deductCompanyBalance(company_id, amount);
        await addCompanyBalance(to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'company_to_company_other'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleUserToUserSame(transferData) {
    // Kullanıcı hesabından aynı firmadaki başka bir kullanıcıya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_same_company_user']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'user' || to_scope !== 'user') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors.to_user_id_required'));
        }

        // Aynı kullanıcıya transfer yapılamaz
        if (user_id === to_user_id) {
            throw new Error(t('errors.cannot_transfer_to_self'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getUserAccountCurrency(to_user_id, company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, company_id);

        // Gönderen kullanıcının yeterli bakiyesi var mı kontrol et (deductAccountBalance içinde kontrol ediliyor)
        await deductAccountBalance(user_id, company_id, amount);
        await addAccountBalance(to_user_id, company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'user_to_user_same'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleUserToUserOther(transferData) {
    // Kullanıcı hesabından başka firmadaki bir kullanıcıya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_other_company_user']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_id, to_user_company_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'user' || to_scope !== 'user') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_id) {
            throw new Error(t('errors.to_user_id_required'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors.to_user_company_id_required'));
        }

        // Aynı kullanıcıya transfer yapılamaz
        if (user_id === to_user_id) {
            throw new Error(t('errors.cannot_transfer_to_self'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getUserAccountCurrency(to_user_id, to_user_company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);
        await validateUserInCompany(to_user_id, to_user_company_id);

        await deductAccountBalance(user_id, company_id, amount);
        await addAccountBalance(to_user_id, to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'user_to_user_other'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleUserToCompanySame(transferData) {
    // Kullanıcı hesabından kendi firmasına transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_own_company']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'user' || to_scope !== 'company') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getCompanyCurrency(company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);

        await deductAccountBalance(user_id, company_id, amount);
        await addCompanyBalance(company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'user_to_company_same'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

async function handleUserToCompanyOther(transferData) {
    // Kullanıcı hesabından başka firmaya transfer

    try {
        const { user_id, company_id } = transferData;
        const hasPermissions = await checkUserRoles(user_id, company_id, ['can_transfer_user_to_other_company']);
        if (!hasPermissions) {
            throw new Error(t('permissions.insufficientPermissions'));
        }

        const { to_user_company_id, from_scope, to_scope, amount, currency } = transferData;
        if (from_scope !== 'user' || to_scope !== 'company') {
            throw new Error(t('errors.invalid_scopes_for_transfer_type'));
        }

        if (!to_user_company_id) {
            throw new Error(t('errors.to_user_company_id_required'));
        }

        // Farklı firma olduğunu doğrula
        if (company_id === to_user_company_id) {
            throw new Error(t('errors.same_company_not_allowed_for_other_transfer'));
        }

        if (!currency || currency !== await getUserAccountCurrency(user_id, company_id) || currency !== await getCompanyCurrency(to_user_company_id)) {
            throw new Error(t('errors.invalid_currency'));
        }

        validateAmount(amount);

        await deductAccountBalance(user_id, company_id, amount);
        await addCompanyBalance(to_user_company_id, amount);

        // Transfer kaydını veritabanına ekle
        const insertQuery = `
            INSERT INTO transfers (
                id, user_id, company_id, to_user_id, to_user_company_id,
                from_scope, to_scope, amount, currency, transfer_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
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
            'user_to_company_other'
        ]);

        return {
            success: true,
            transferId: transferData.id,
            message: t('transfers.create.success')
        };

    } catch (error) {
        throw {
            success: false,
            message: error.message || t('transfers.create.failed')
        };
    }
}

module.exports = createTransfer;