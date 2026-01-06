const express = require('express');
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18n.config");
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {getUserWorkSessions} = require("../../../database/userCompanyEntries");
const getUserById = require("../../../database/users/getUserById");
const router = express.Router();

/**
 * @swagger
 * /work-status/user-work-status:
 *   post:
 *     summary: Kullanıcının çalışma seanslarını getirir
 *     description: Belirtilen kullanıcının belirli tarihler arasındaki giriş-çıkış kayıtlarını ve çalışma sürelerini getirir
 *     tags:
 *       - Work Status
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - companyId
 *               - startDate
 *               - endDate
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 description: Hedef kullanıcı ID
 *               companyId:
 *                 type: string
 *                 description: Şirket ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Başlangıç tarihi (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Bitiş tarihi (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Çalışma seansları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       entryTime:
 *                         type: string
 *                         format: date-time
 *                       exitTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       durationMinutes:
 *                         type: number
 *                         nullable: true
 *                       entryNote:
 *                         type: string
 *                         nullable: true
 *                       exitNote:
 *                         type: string
 *                         nullable: true
 *                       isOpen:
 *                         type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "USR_5be149a20df10d5d"
 *                     name:
 *                       type: string
 *                       example: "Fatih"
 *                     surname:
 *                       type: string
 *                       example: "Gencal"
 *                     phone:
 *                       type: string
 *                       example: "905466112233"
 *                 totalMinutes:
 *                   type: number
 *       400:
 *         description: Geçersiz parametreler
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Yetki yetersiz
 */
router.post('/user-work-status', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {targetUserId, companyId, startDate, endDate} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!targetUserId) {
            return responseHelper.error(res, t('workStatus:get.targetUserIdRequired'), 400);
        }

        if (!companyId) {
            return responseHelper.error(res, t('workStatus:get.companyIdRequired'), 400);
        }

        if (!startDate || !endDate) {
            return responseHelper.error(res, t('workStatus:get.dateRangeRequired'), 400);
        }

        if (userId !== targetUserId) {
            const hasPermission = await checkUserRoles(userId, companyId, ['can_view_users_work_status']);

            if (!hasPermission) {
                return responseHelper.error(res, t('workStatus:get.cannotAccess'), 403);
            }
        }

        const sessions = await getUserWorkSessions(targetUserId, companyId, startDate, endDate);
        const user = await getUserById(targetUserId, ['id', 'name', 'surname', 'phone']);

        const totalMinutes = sessions
            .filter(session => session.durationMinutes !== null)
            .reduce((sum, session) => sum + session.durationMinutes, 0);

        return responseHelper.success(res, {
            sessions,
            user,
            totalMinutes
        });

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
