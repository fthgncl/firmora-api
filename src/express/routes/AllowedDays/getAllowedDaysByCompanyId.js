const express = require('express');
const router = express.Router();
const getAllowedDaysByCompanyId = require('../../../database/allowedDays/getAllowedDaysByCompanyId');
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {checkUserRoles} = require("../../../utils/permissionsManager");

/**
 * @swagger
 * tags:
 *   name: User Allowed Days
 *   description: Kullanıcı izin günleri yönetimi
 */

/**
 * @swagger
 * /user-allowed-days/get-by-company-id:
 *   get:
 *     summary: Firmaya göre izin günlerini getir
 *     description: Belirtilen firma ID'sine göre tüm kullanıcı izin günlerini getirir. Tarih aralığı ile filtreleme yapılabilir.
 *     tags: [User Allowed Days]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Firma ID
 *         example: "COM123456"
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Başlangıç tarihi (YYYY-MM-DD HH:mm:ss)
 *         example: "2021-01-01 00:00:00"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Bitiş tarihi (YYYY-MM-DD HH:mm:ss)
 *         example: "2021-12-31 23:59:59"
 *     responses:
 *       200:
 *         description: İzin günleri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: İzin günü ID'si
 *                       user_id:
 *                         type: string
 *                         description: Kullanıcı ID'si
 *                       company_id:
 *                         type: string
 *                         description: Firma ID'si
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         description: Başlangıç tarihi
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         description: Bitiş tarihi
 *                       description:
 *                         type: string
 *                         description: Açıklama
 *                       filesCount:
 *                         type: integer
 *                         description: Dosya sayısı
 *                       getFilesToken:
 *                         type: string
 *                         description: Dosyaları indirmek için token
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
 *                   example: "Firma ID zorunludur"
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
 *       403:
 *         description: Yetki hatası
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
 *                   example: "Bu firmada erişim yetkiniz yok"
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

router.get('/get-by-company-id', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {companyId, startDate, endDate} = req.query;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Firma ID kontrolü
        if (!companyId) {
            return responseHelper.error(res, t('allowedDays:getByCompanyId.companyIdRequired'), 400);
        }

        if (!startDate || !endDate) {
            return responseHelper.error(res, t('allowedDays:getByCompanyId.dateRangeRequired'), 400);
        }

        const hasPermission = await checkUserRoles(userId, companyId, ['can_view_users_work_status']);

        if (!hasPermission) {
            return responseHelper.error(res, t('workStatus:get.cannotAccessInCompany'), 403);
        }

        const allowedDays = await getAllowedDaysByCompanyId(companyId, startDate, endDate);

        return responseHelper.success(res, allowedDays);

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
