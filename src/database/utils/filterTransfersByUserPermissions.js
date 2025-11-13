const {checkUserRoles} = require("../../utils/permissionsManager");

const filterTransfersByUserPermissions = async (userId, transfer) => {

    const {user_id, company_id, to_user_id, to_user_company_id, from_scope, to_scope} = transfer;

    if ( user_id !== userId ) {
        if ( from_scope === 'company' ) {
            if ( !await checkUserRoles(userId,company_id,['can_view_company_transfer_history']) ) {
                delete transfer.sender_final_balance;
            }
        }
        if ( from_scope === 'user' ) {
            if ( !await checkUserRoles(userId,company_id,['can_view_other_users_transfer_history']) ) {
                delete transfer.sender_final_balance;
            }
        }
    }

    if ( user_id !== to_user_id ) {
        if ( to_scope === 'company' ) {
            if ( !await checkUserRoles(userId,to_user_company_id,['can_view_company_transfer_history']) ) {
                delete transfer.receiver_final_balance;
            }
        }
        if ( from_scope === 'user' ) {
            if ( !await checkUserRoles(userId,to_user_company_id,['can_view_other_users_transfer_history']) ) {
                delete transfer.receiver_final_balance;
            }
        }
    }

}

module.exports = filterTransfersByUserPermissions;