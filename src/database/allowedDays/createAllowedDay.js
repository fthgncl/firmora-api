const {queryAsync, beginTransaction, commit, rollback} = require('../utils/connection');
const {generateUniqueId} = require('../../utils/idUtils');
const {t} = require('../../config/i18n.config');
const {handleFileUploadWithDatePath} = require("../../express/utils/fileUploadHandler");

const createAllowedDay = async (startDate, endDate, userId, companyId, uploadedFiles) => {


    const allowedDayId = await generateUniqueId("AD", "user_allowed_days")
    const files = await handleFileUploadWithDatePath(uploadedFiles, 'allowedAttachments');

    try {
        // Transaction başlat
        await beginTransaction();

        await queryAsync('INSERT INTO user_allowed_days (id, user_id, company_id, start_date, end_date, files) VALUES (?, ?, ?, ?, ?, ?)', [allowedDayId, userId, companyId, startDate, endDate, files]);

        // İşlem başarılı, commit yap
        await commit();
        return result;

    } catch (error) {
        // Hata durumunda rollback yap
        await rollback();
        throw error;
    }
};


module.exports = createAllowedDay;