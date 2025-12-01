const {queryAsync} = require('../utils/connection');
const {t} = require('../../config/i18n.config');
const {getCompanyById} = require("./index");


async function getCompanyTotalBalance(companyId) {

    try {
        if (!companyId) {
            throw new Error(t('companies:getCompanyById.companyIdRequired'));
        }

        const { balance } = await getCompanyById(companyId,['balance']);

        // user_accounts tablosunda company_id alanı eşleşen tüm alanların balance değerlerini topla
        const sql = `SELECT SUM(balance) AS total_balance
                     FROM user_accounts
                     WHERE company_id = ?`;

        // Sorguyu çalıştır
        const results = await queryAsync(sql, [companyId]);

        // Toplam bakiyeyi döndür
        return balance + ( results[0].total_balance || 0);

    } catch (error) {
        throw new Error(`${t('companies:getCompanyTotalBalance.error')}: ${error.message}`);
    }

}

module.exports = getCompanyTotalBalance;
