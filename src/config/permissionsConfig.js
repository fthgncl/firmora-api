
const permissions = {
    "sys_admin": {
        "code": "a",
        "category": "system",
        "name_key": "permissions.sys_admin.name",
        "description_key": "permissions.sys_admin.description"
    },
    "user_management": {
        "code": "b",
        "category": "system",
        "name_key": "permissions.user_management.name",
        "description_key": "permissions.user_management.description"
    },
    "create_user": {
        "code": "c",
        "category": "system",
        "name_key": "permissions.create_user.name",
        "description_key": "permissions.create_user.description"
    },
    "delete_user": {
        "code": "d",
        "category": "system",
        "name_key": "permissions.delete_user.name",
        "description_key": "permissions.delete_user.description"
    },
    "modify_permissions": {
        "code": "e",
        "category": "system",
        "name_key": "permissions.modify_permissions.name",
        "description_key": "permissions.modify_permissions.description"
    },
}
module.exports = permissions;