const { t } = require('./i18n.config');

const permissions = {
    "sys_admin": {
        "code": "a",
        "category": "permissions:categories.system",
        "name": "permissions:sys_admin.name",
        "description": "permissions:sys_admin.description"
    },
    "immunity": {
        "code": "n",
        "category": "permissions:categories.system",
        "name": "permissions:immunity.name",
        "description": "permissions:immunity.description"
    },
    "personnel_manager": {
        "code": "b",
        "category": "permissions:categories.personnel",
        "name": "permissions:personnel_manager.name",
        "description": "permissions:personnel_manager.description"
    },
    "can_transfer_company_to_same_company_user": {
        "code": "c",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_company_to_same_company_user.name",
        "description": "permissions:can_transfer_company_to_same_company_user.description"
    },
    "can_transfer_company_to_other_company_user": {
        "code": "d",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_company_to_other_company_user.name",
        "description": "permissions:can_transfer_company_to_other_company_user.description"
    },
    "can_transfer_company_to_other_company": {
        "code": "e",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_company_to_other_company.name",
        "description": "permissions:can_transfer_company_to_other_company.description"
    },
    "can_transfer_user_to_same_company_user": {
        "code": "f",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_user_to_same_company_user.name",
        "description": "permissions:can_transfer_user_to_same_company_user.description"
    },
    "can_transfer_user_to_other_company_user": {
        "code": "g",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_user_to_other_company_user.name",
        "description": "permissions:can_transfer_user_to_other_company_user.description"
    },
    "can_transfer_user_to_own_company": {
        "code": "h",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_user_to_own_company.name",
        "description": "permissions:can_transfer_user_to_own_company.description"
    },
    "can_transfer_user_to_other_company": {
        "code": "i",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_user_to_other_company.name",
        "description": "permissions:can_transfer_user_to_other_company.description"
    },
    "can_transfer_user_to_external": {
        "code": "j",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_user_to_external.name",
        "description": "permissions:can_transfer_user_to_external.description"
    },
    "can_transfer_company_to_external": {
        "code": "k",
        "category": "permissions:categories.financial",
        "name": "permissions:can_transfer_company_to_external.name",
        "description": "permissions:can_transfer_company_to_external.description"
    },
    "can_receive_external_to_user": {
        "code": "l",
        "category": "permissions:categories.financial",
        "name": "permissions:can_receive_external_to_user.name",
        "description": "permissions:can_receive_external_to_user.description"
    },
    "can_receive_external_to_company": {
        "code": "m",
        "category": "permissions:categories.financial",
        "name": "permissions:can_receive_external_to_company.name",
        "description": "permissions:can_receive_external_to_company.description"
    },
    "can_view_company_transfer_history": {
        "code": "o",
        "category": "permissions:categories.financial",
        "name": "permissions:can_view_company_transfer_history.name",
        "description": "permissions:can_view_company_transfer_history.description"
    },
    "can_view_other_users_transfer_history": {
        "code": "p",
        "category": "permissions:categories.financial",
        "name": "permissions:can_view_other_users_transfer_history.name",
        "description": "permissions:can_view_other_users_transfer_history.description"
    },
    "can_approve_transfers": {
        "code": "q",
        "category": "permissions:categories.financial",
        "name": "permissions:can_approve_transfers.name",
        "description": "permissions:can_approve_transfers.description"
    }
};

// TODO: Firma gideri ekleme izni vb. izinler ekle
// TODO: Kişisel gider ekleme izni vb. izinler ekle

function getTranslatedPermissions(lang = process.env.DEFAULT_LANGUAGE) {
    const translatedPermissions = {};
    for (const [key, permission] of Object.entries(permissions)) {
        translatedPermissions[key] = {
            code: permission.code,
            lang,
            category: t(permission.category, { lng: lang }),
            name: t(permission.name, { lng: lang }),
            description: t(permission.description, { lng: lang })
        };
    }
    return translatedPermissions;
}

module.exports = getTranslatedPermissions;
