const express = require('express');
const router = express.Router();
const getAllowedDayById = require('../../../database/allowedDays/getAllowedDaysById');
const {t} = require('../../../config/i18n.config');
const responseHelper = require('../../utils/responseHelper');
const {checkUserRoles} = require('../../../utils/permissionsManager');
const getUserById = require("../../../database/users/getUserById");

/**
 * @swagger
 * /user-allowed-days/get:
 *   post:
 *     summary: İzin günü bilgisini ID'ye göre getirir
 *     description: Belirtilen ID'ye sahip izin günü kaydının detaylarını ve ilişkili kullanıcı bilgilerini getirir
 *     tags:
 *       - User Allowed Days
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allowedDayId
 *             properties:
 *               allowedDayId:
 *                 type: string
 *                 description: İzin günü kaydının ID'si
 *                 example: "ALD_5be149a20df10d5d"
 *     responses:
 *       200:
 *         description: İzin günü bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     allowedDay:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "AD_5e05cf13d2706627"
 *                         user_id:
 *                           type: string
 *                           example: "USR_5be149a20df10d5d"
 *                         company_id:
 *                           type: string
 *                           example: "COM_75441bb5871d5970"
 *                         start_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-18T21:00:00.000Z"
 *                         end_date:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-23T20:59:00.000Z"
 *                         description:
 *                           type: string
 *                           nullable: true
 *                           example: "Test açıklama"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-12T18:33:12.000Z"
 *                         filesCount:
 *                           type: integer
 *                           description: İzin gününe ait dosya sayısı
 *                           example: 3
 *                         getFilesToken:
 *                           type: string
 *                           description: Dosyaları almak için kullanılan JWT token
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGxvd2VkRGF5SWQiOiJBRF81ZTA1Y2YxM2QyNzA2NjI3IiwiaWF0IjoxNzY4MjQ2OTgzLCJleHAiOjE3NjgyNDc4ODN9.LHY1_imKlVt3VxwhvnfUMcGGmIKyxdKtw4P8BVxG3SY"
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Fatih"
 *                         surname:
 *                           type: string
 *                           example: "Gençal"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "İzin günü başarıyla alındı."
 *       400:
 *         description: Geçersiz parametreler
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Yetki yetersiz
 *       404:
 *         description: İzin günü kaydı bulunamadı
 */

router.post('/get', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {allowedDayId} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // AllowedDay ID kontrolü
        if (!allowedDayId) {
            return responseHelper.error(res, t('allowedDays:getId.allowedDayIdRequired'), 400);
        }

        // İzin günü bilgilerini çek
        const {allowedDay} = await getAllowedDayById(allowedDayId);

        if (!allowedDay) {
            return responseHelper.error(res, t('allowedDays:getId.notFound'), 404);
        }


        const hasPermissions = await checkUserRoles(userId, allowedDay.company_id, ['can_view_users_work_status']);
        if (!hasPermissions) {
            throw new Error(t('errors:permissions.cannotViewOtherUserWorkStatus'));

        }

        delete allowedDay.files;

        const user = await getUserById(allowedDay.user_id, ['name', 'surname']);

        return responseHelper.success(res, {
            data: {
                allowedDay,
                user
            },
            message: t('allowedDays:getId.success')
        });

    } catch (error) {
        if (error.status === 500) {
            return responseHelper.serverError(res, error);
        }
        return responseHelper.error(res, error.message, error.status || 400);
    }
});

module.exports = router;