
const { t } = require('./i18nConfig');

const permissions = {
    "sys_admin": {
        "code": "a",
        "category": "permissions.categories.system",
        "name": "permissions.sys_admin.name",
        "description": "permissions.sys_admin.description"
    },
    "personnel_manager": {
        "code": "b",
        "category": "permissions.categories.personnel",
        "name": "permissions.personnel_manager.name",
        "description": "permissions.personnel_manager.description"
    },
    "can_transfer_company_to_same_company_user": {
        "code": "c",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_company_to_same_company_user.name",
        "description": "permissions.can_transfer_company_to_same_company_user.description"
    },
    "can_transfer_company_to_other_company_user": {
        "code": "d",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_company_to_other_company_user.name",
        "description": "permissions.can_transfer_company_to_other_company_user.description"
    },
    "can_transfer_company_to_other_company": {
        "code": "e",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_company_to_other_company.name",
        "description": "permissions.can_transfer_company_to_other_company.description"
    },
    "can_transfer_user_to_same_company_user": {
        "code": "f",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_user_to_same_company_user.name",
        "description": "permissions.can_transfer_user_to_same_company_user.description"
    },
    "can_transfer_user_to_other_company_user": {
        "code": "g",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_user_to_other_company_user.name",
        "description": "permissions.can_transfer_user_to_other_company_user.description"
    },
    "can_transfer_user_to_own_company": {
        "code": "h",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_user_to_own_company.name",
        "description": "permissions.can_transfer_user_to_own_company.description"
    },
    "can_transfer_user_to_other_company": {
        "code": "i",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_user_to_other_company.name",
        "description": "permissions.can_transfer_user_to_other_company.description"
    }
}

function getTranslatedPermissions(lang = process.env.DEFAULT_LANGUAGE) {
    const translatedPermissions = {};

    for (const [key, permission] of Object.entries(permissions)) {
        translatedPermissions[key] = {
            code: permission.code,
            category: t(permission.category, { lng: lang }),
            name: t(permission.name, { lng: lang }),
            description: t(permission.description, { lng: lang })
        };
    }

    return translatedPermissions;
}



module.exports = getTranslatedPermissions;