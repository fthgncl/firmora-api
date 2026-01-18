const express = require('express');
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18n.config");
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {getEntryById, updateEntry} = require("../../../database/userCompanyEntries");
const {isValidIsoDate} = require("../../../utils/validation");
const router = express.Router();

/**
 * @swagger
 * /work-status/update-work-status-date:
 *   post:
 *     summary: Çalışma durumu tarihini günceller
 *     description: Giriş/çıkış kaydının tarihini günceller. Bu işlem için çalışma saatlerini düzenleme yetkisi gereklidir.
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
 *               - entryId
 *               - newDate
 *             properties:
 *               entryId:
 *                 type: string
 *                 description: Güncellenecek giriş/çıkış kaydının ID'si
 *                 example: "ENT_b1cbd61e6a50afa0"
 *               newDate:
 *                 type: string
 *                 format: date-time
 *                 description: Yeni tarih (ISO 8601 formatında, örn. 2024-05-20T14:30:00.000Z)
 *                 example: "2024-05-20T14:30:00.000Z"
 *     responses:
 *       200:
 *         description: Tarih başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Tarih başarıyla güncellendi"
 *       400:
 *         description: Geçersiz parametreler veya tarih formatı
 *       401:
 *         description: Yetkisiz erişim
 *       403:
 *         description: Çalışma saatlerini düzenleme yetkisi yok
 *       404:
 *         description: Kayıt bulunamadı
 */
router.post('/update-work-status-date', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {entryId, newDate} = req.body;

        const {data} = await getEntryById(entryId);
        const { entry, company } = data;

        if ( !newDate ) {
            return responseHelper.error(res, t('workStatus:update.newDateRequired'), 400);
        }

        const date = new Date(newDate);

        if ( !isValidIsoDate(newDate) || isNaN(date.getTime())) {
            return responseHelper.error(res, t('workStatus:update.invalidDateFormat'), 400);
        }

        const hasPermission = await checkUserRoles(userId, company.id, ['can_edit_work_hours']);

        if (!hasPermission) {
            return responseHelper.error(res, t('errors:permissions.cannotEditWorkHours'), 403);
        }

        const updateData = {
            created_at: date
        }

        const result = await updateEntry(entry.id, updateData);


        return responseHelper.success(res, {
            status: result.status,
            message: result.message
        });

    } catch (error) {
        if (error.statusCode || error.status) {
            return responseHelper.error(res, error.message, error.statusCode);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
