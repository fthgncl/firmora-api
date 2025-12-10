const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18n.config");
const getTransferById = require("./getTransferById");
const {deductCompanyBalance} = require("../companies");
const {deductAccountBalance} = require("../accounts");

async function rejectTransfer(transferId, userId) {

    if (!transferId) {
        throw new Error(t('transfers:getById.transferIdRequired'));
    }

    if (typeof transferId !== 'string') {
        throw new Error(t('transfers:getById.invalidTransferId'));
    }

    if (!userId) {
        throw new Error(t('transfers:rejectTransfer.userIdRequired'));
    }

    try {

        const transfer = await getTransferById(transferId);

        if (!transfer) {
            throw new Error(t('transfers:getById.notFound'));
        }

        switch (transfer.status) {
            case 'pending':
                await pendingToReject(transfer, userId);
                break;
            case 'completed':
                throw new Error(t('transfers:rejectTransfer.transferAlreadyApproved'));
            case 'reject':
                throw new Error(t('transfers:rejectTransfer.transferAlreadyRejected'));
            default:
                throw new Error(t('transfers:rejectTransfer.unknownTransferStatus'));
        }

        return {status: "success", message: t('transfers:rejectTransfer.success'), transferId: transfer.id};
    } catch (error) {
        throw error
    }
}

async function pendingToReject(transfer, userId) {
    try {
        await queryAsync('START TRANSACTION');

        // Transfer'ı onayla
        const result = await queryAsync(
            `UPDATE transfers
             SET status = 'reject',
                 processed_by = ?,
                 processed_at = NOW()
             WHERE id = ?`,
            [userId, transfer.id]
        );

        if (!result || result.affectedRows === 0) {
            throw new Error(t('transfers:rejectTransfer.updateFailed'));
        }

        // Alıcının bakiyesini güncelle
        switch (transfer.from_scope) {
            case 'company':
                await deductCompanyBalance(transfer.company_id, transfer.amount);
                break;
            case 'user':
                await deductAccountBalance(transfer.user_id, transfer.company_id, transfer.amount);
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


module.exports = rejectTransfer;