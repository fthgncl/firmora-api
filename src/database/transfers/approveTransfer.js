const {queryAsync} = require("../utils/connection");
const {t} = require("../../config/i18n.config");
const getTransferById = require("./getTransferById");

async function approveTransfer(transferId) {

    if (!transferId) {
        throw new Error(t('transfers:getById.transferIdRequired'));
    }

    if (typeof transferId !== 'string') {
        throw new Error(t('transfers:getById.invalidTransferId'));
    }

    try {

        const {status} = await getTransferById(transferId,['status']);


        switch (status) {
            case 'pending':
                await queryAsync(`UPDATE transfers SET status = 'completed' WHERE id = ?`, [transferId]);
                break;
            case 'completed':
                throw new Error(t('transfers:approveTransfer.transferAlreadyApproved'));
            default:
                throw new Error(t('transfers:approveTransfer.unknownTransferStatus'));
        }

        return { success: true, message: t('transfers:approveTransfer.success') };
    } catch (error) {
        throw error
    }
}

module.exports = approveTransfer;