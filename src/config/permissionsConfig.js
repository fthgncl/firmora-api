
const permissions = {
    "sys_admin": {
        "code": "a",
        "category": "system",
        "name_key": "permissions.sys_admin.name",
        "description_key": "permissions.sys_admin.description"
    },
    "personnel_manager": {
        "code": "b",
        "category": "personnel",
        "name_key": "permissions.personnel_manager.name",
        "description_key": "permissions.personnel_manager.description"
    },
    "can_transfer_money": {
        "code": "c",
        "category": "financial",
        "name_key": "permissions.can_transfer_money.name",
        "description_key": "permissions.can_transfer_money.description"
    },
    "can_transfer_external": {
        "code": "d",
        "category": "financial",
        "name_key": "permissions.can_transfer_external.name",
        "description_key": "permissions.can_transfer_external.description"
    }
}
module.exports = permissions;