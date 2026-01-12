const express = require('express');
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18n.config");
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {getUserWorkSessions} = require("../../../database/userCompanyEntries");
const {getEmployeesByCompanyId} = require("../../../database/companies");
const {getAllowedDaysByCompanyId} = require("../../../database/allowedDays");
const router = express.Router();

/**
 * @swagger
 * /work-status/company-users-work-status:
 *   post:
 *     summary: Şirket çalışanlarının çalışma seanslarını getirir
 *     description: Belirtilen şirketteki tüm çalışanların belirli tarihler arasındaki giriş-çıkış kayıtlarını ve çalışma sürelerini getirir
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
 *               - companyId
 *               - startDate
 *               - endDate
 *             properties:
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
 *         description: Çalışanların çalışma seansları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "USR_5be149a20df10d5d"
 *                       name:
 *                         type: string
 *                         example: "Fatih"
 *                       surname:
 *                         type: string
 *                         example: "Gençal"
 *                       phone:
 *                         type: string
 *                         example: "905466234445"
 *                       sessions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             entryTime:
 *                               type: string
 *                               format: date-time
 *                             exitTime:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             durationMinutes:
 *                               type: number
 *                               nullable: true
 *                             entryNote:
 *                               type: string
 *                               nullable: true
 *                             exitNote:
 *                               type: string
 *                               nullable: true
 *                             isOpen:
 *                               type: boolean
 *                       totalMinutes:
 *                         type: number
 *                 allowedDays:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "AD_97067d0322e89250"
 *                       user_id:
 *                         type: string
 *                         example: "USR_5be149a20df10d5d"
 *                       company_id:
 *                         type: string
 *                         example: "COM_75441bb5871d5970"
 *                       start_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-18T21:00:00.000Z"
 *                       end_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-23T20:59:00.000Z"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-01-12T00:15:13.000Z"
 *                       filesCount:
 *                         type: number
 *                         example: 0
 *                       getFilesToken:
 *                         type: string
 *                         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Geçersiz parametreler
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Yetki yetersiz
 */
router.post('/company-users-work-status', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {companyId, startDate, endDate} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!companyId) {
            return responseHelper.error(res, t('workStatus:get.companyIdRequired'), 400);
        }

        if (!startDate || !endDate) {
            return responseHelper.error(res, t('workStatus:get.dateRangeRequired'), 400);
        }

        const hasPermission = await checkUserRoles(userId, companyId, ['can_view_users_work_status']);

        if (!hasPermission) {
            return responseHelper.error(res, t('workStatus:get.cannotAccessInCompany'), 403);
        }

        const employees = await getEmployeesByCompanyId(companyId, ['id', 'name', 'surname', 'phone']);
        const {allowedDays} = await getAllowedDaysByCompanyId(companyId, startDate, endDate)
        const updatedEmployees = await Promise.all(
            employees.map(async (employee) => {
                employee.sessions = await getUserWorkSessions(
                    employee.id,
                    companyId,
                    startDate,
                    endDate
                );

                employee.totalMinutes = employee.sessions
                    .filter(session => session.durationMinutes !== null)
                    .reduce((sum, session) => sum + session.durationMinutes, 0);

                return employee;
            })
        );

        return responseHelper.success(res, {
            employees: updatedEmployees,
            allowedDays
        });

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
