const express = require('express');
const router = express.Router();
const createAllowedDay = require('../../../database/allowedDays/createAllowedDay');
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {uploadConfig} = require('../../config/uploadConfig');
const uploadMiddleware = require('../../middleware/uploadMiddleware');
const moment = require("moment");

/**
 * @swagger
 * tags:
 *   name: User Allowed Days
 *   description: Kullanıcı izin günleri yönetimi
 */

/**
 * @swagger
 * /user-allowed-days/create:
 *   post:
 *     summary: Yeni izin günü oluştur
 *     description: Kullanıcı için yeni bir izin günü kaydı oluşturur. İsteğe bağlı olarak dosya yüklenebilir.
 *     tags: [User Allowed Days]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *               - companyId
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: İzin başlangıç tarihi ve saati (örn. 2021-01-01 13:00:00)
 *                 example: "2021-01-01 13:00:00"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: İzin bitiş tarihi ve saati (örn. 2021-01-31 13:00:00)
 *                 example: "2021-01-31 13:00:00"
 *               companyId:
 *                 type: string
 *                 description: Firma ID
 *                 example: "COM123456"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Yüklenecek dosyalar (opsiyonel)
 *     responses:
 *       200:
 *         description: İzin günü başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Başarı mesajı
 *                     allowedDayId:
 *                       type: string
 *                       description: Oluşturulan izin günü ID'si
 *       400:
 *         description: Geçersiz istek parametreleri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Başlangıç ve bitiş tarihi zorunludur"
 *       401:
 *         description: Yetkilendirme hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Token eksik"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */

router.post('/create', uploadMiddleware(uploadConfig.allowedAttachments.maxFileCount, 'files'), async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {startDate, endDate, companyId, description = null} = req.body;
        const uploadedFiles = req.files || null;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Firma ID kontrolü
        if (!companyId) {
            return responseHelper.error(res, t('companies:get.companyIdRequired'), 400);
        }

        if (!startDate || !endDate) {
            return responseHelper.error(res, t('allowedDays:create.startDateEndDateRequired'), 400);
        }

        if (!moment(startDate).isValid() || !moment(endDate).isValid()) {
            return responseHelper.error(res, t('allowedDays:create.invalidDateFormat'), 400);
        }

        if (moment(endDate).isBefore(moment(startDate))) {
            return responseHelper.error(res, t('allowedDays:create.endDateBeforeStartDate'), 400);
        }

        if (description && description.length > 255) {
            return responseHelper.error(res, t('allowedDays:create.descriptionTooLong',{maxLength: 255}), 400);
        }

        // ISO formatındaki tarihleri MySQL DATETIME formatına dönüştür
        const formattedStartDate = moment(startDate).format('YYYY-MM-DD HH:mm:ss');
        const formattedEndDate = moment(endDate).format('YYYY-MM-DD HH:mm:ss');

        const result = await createAllowedDay(userId, formattedStartDate, formattedEndDate, companyId, description, uploadedFiles);

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