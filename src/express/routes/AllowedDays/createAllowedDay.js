const express = require('express');
const router = express.Router();
const createAllowedDay = require('../../../database/allowedDays/createAllowedDay');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18n.config');
const { uploadConfig } = require('../../config/uploadConfig');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const moment = require("moment");

router.post('/create', uploadMiddleware(uploadConfig.receipt.maxFileCount), async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const { startDate, endDate, companyId } = req.body;
        const uploadedFiles = req.files || null;

        // Örnek req.body: { startDate: "2021-01-01 13:00:00", endDate: "2021-01-31 13:00:00", companyId: "COM123456" }

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Firma ID kontrolü
        if (!companyId) {
            return responseHelper.error(res, t('companies:get.companyIdRequired'), 400);
        }

        if (!startDate || !endDate){
            return responseHelper.error(res, t('allowedDays:create.startDateEndDateRequired'), 400);
        }

        if (!moment(startDate).isValid() || !moment(endDate).isValid()){
            return responseHelper.error(res, t('allowedDays:create.invalidDateFormat'), 400);
        }

        if (moment(endDate).isBefore(moment(startDate))) {
            return responseHelper.error(res, t('allowedDays:create.endDateBeforeStartDate'), 400);
        }


        // AllowedDay oluştur - dosyaları da parametre olarak gönder
        const result = await createAllowedDay(userId, startDate, endDate, companyId, uploadedFiles);

        return responseHelper.success(res, {
            message: result.message,
            allowedDayId: result.allowedDayId
        });

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;