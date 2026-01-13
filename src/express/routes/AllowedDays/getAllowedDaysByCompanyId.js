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
 *                         example: "ALD_5be149a20df10d5d"
 *                       user_id:
 *                         type: string
 *                         description: Kullanıcı ID'si
 *                         example: "USR_5be149a20df10d5d"
 *                       company_id:
 *                         type: string
 *                         description: Firma ID'si
 *                         example: "COM_75441bb5871d5970"
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         description: Başlangıç tarihi
 *                         example: "2026-01-18T21:00:00.000Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         description: Bitiş tarihi
 *                         example: "2026-01-23T20:59:00.000Z"
 *                       description:
 *                         type: string
 *                         description: Açıklama
 *                         example: "Test açıklama"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Oluşturulma tarihi
 *                         example: "2026-01-12T18:33:12.000Z"
 *                       filesCount:
 *                         type: integer
 *                         description: Dosya sayısı
 *                         example: 3
 *                       getFilesToken:
 *                         type: string
 *                         description: Dosyaları indirmek için token
 *                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd2VkRGF5SWQiOiJBTERfNWJlMTQ5YTIwZGYxMGQ1ZCIsImlhdCI6MTc2ODI4NTk3NywiZXhwIjoxNzY4Mjg2ODc3fQ.9EtCvJBC_rV8jfgjewJhSBxbNd1vHXH5vJXk5xWP1EI"
 *                       user:
 *                         type: object
 *                         description: Kullanıcı bilgileri
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Kullanıcı adı
 *                             example: "Fatih"
 *                           surname:
 *                             type: string
 *                             description: Kullanıcı soyadı
 *                             example: "Gençal"
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
