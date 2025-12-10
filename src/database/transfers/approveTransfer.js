const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18n.config");
const getTransferById = require("./getTransferById");
const {addCompanyBalance, getCompanyById} = require("../companies");
const {addAccountBalance, getAccountsByUserId} = require("../accounts");

async function approveTransfer(transferId, userId) {

    if (!transferId) {
        throw new Error(t('transfers:getById.transferIdRequired'));
    }

    if (typeof transferId !== 'string') {
        throw new Error(t('transfers:getById.invalidTransferId'));
    }

    if (!userId) {
        throw new Error(t('transfers:approveTransfer.userIdRequired'));
    }

    try {

        const transfer = await getTransferById(transferId);

        if (!transfer) {
            throw new Error(t('transfers:getById.notFound'));
        }

        switch (transfer.status) {
            case 'pending':
                await pendingToCompleted(transfer, userId);
                break;
            case 'completed':
                throw new Error(t('transfers:approveTransfer.transferAlreadyApproved'));
            case 'reject':
                throw new Error(t('transfers:approveTransfer.transferAlreadyRejected'));
            default:
                throw new Error(t('transfers:approveTransfer.unknownTransferStatus'));
        }

        return {status: "success", message: t('transfers:approveTransfer.success'), transferId: transfer.id};
    } catch (error) {
        throw error
    }
}

async function pendingToCompleted(transfer, userId) {
    try {
        await queryAsync('START TRANSACTION');

        const receiver_final_balance = await getFinalBalance(transfer);

        // Transfer'ı onayla
        const result = await queryAsync(
            `UPDATE transfers SET status = 'completed', processed_by = ?, processed_at = NOW(), receiver_final_balance = ? WHERE id = ?`,
            [userId, receiver_final_balance, transfer.id]
        );

        if (!result || result.affectedRows === 0) {
            throw new Error(t('transfers:approveTransfer.updateFailed'));
        }

        // Alıcının bakiyesini güncelle
        switch (transfer.to_scope){
            case 'company':
                await addCompanyBalance(transfer.to_user_company_id, transfer.amount);
                break;
            case 'user':
                await addAccountBalance(transfer.to_user_id, transfer.to_user_company_id, transfer.amount);
                break;
            case 'external':
                // Sistem dışı transfer, bakiye güncellenmez
                break;
            default:
                throw new Error(t('transfers:approveTransfer.invalidToScope'));
        }

        await queryAsync('COMMIT');

        return transfer;
    } catch (error) {
        await queryAsync('ROLLBACK');
        throw error;
    }
}

async function getFinalBalance(transfer) {
    let toCurrentBalance = null;

    if (transfer.to_scope === 'company') {
        const company = await getCompanyById(transfer.to_user_company_id, ['balance', 'currency']);
        if (company && company.currency !== transfer.currency) {
            throw new Error(t('transfers:approveTransfer.currencyMismatch'));
        }
        toCurrentBalance = company?.balance ?? null;
    } else if (transfer.to_scope === 'user') {
        const {accounts} = await getAccountsByUserId(transfer.to_user_id, ['balance', 'currency'], transfer.to_user_company_id);
        if (accounts.length > 0 && accounts[0].currency !== transfer.currency) {
            throw new Error(t('transfers:approveTransfer.currencyMismatch'));
        }
        toCurrentBalance = accounts.length > 0 ? accounts[0].balance : null;
    } else if (transfer.to_scope === 'external') {
        // Sistem dışı transfer için final balance hesaplanmaz
        return null;
    }

    return toCurrentBalance == null ? null : toCurrentBalance + transfer.amount;
}


module.exports = approveTransfer;