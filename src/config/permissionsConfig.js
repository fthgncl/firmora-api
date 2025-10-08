
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
    "can_transfer_money": {
        "code": "c",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_money.name",
        "description": "permissions.can_transfer_money.description"
    },
    "can_transfer_external": {
        "code": "d",
        "category": "permissions.categories.financial",
        "name": "permissions.can_transfer_external.name",
        "description": "permissions.can_transfer_external.description"
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