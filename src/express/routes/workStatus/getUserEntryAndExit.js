const express = require('express');
const router = express.Router();
const responseHelper = require("../../utils/responseHelper");
const {t} = require("../../../config/i18n.config");
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {getEntryById} = require("../../../database/userCompanyEntries");

/**
 * @swagger
 * /work-status/get-user-entry-and-exit:
 *   post:
 *     summary: Kullanıcının giriş ve çıkış bilgilerini getir
 *     description: Belirtilen giriş ve çıkış ID'lerine ait bilgileri döndürür. Kullanıcı kendi kayıtlarını veya yetkisi varsa diğer kullanıcıların kayıtlarını görüntüleyebilir.
 *     tags: [Work Status]
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
 *               - exitId
 *             properties:
 *               entryId:
 *                 type: string
 *                 description: Giriş kaydının ID'si
 *                 example: "ENT_6b0ffb3896c2783a"
 *               exitId:
 *                 type: string
 *                 description: Çıkış kaydının ID'si
 *                 example: "ENT_7a126a0f1aa5b617"
 *     responses:
 *       200:
 *         description: Giriş ve çıkış bilgileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     entry:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "ENT_6b0ffb3896c2783a"
 *                         user_id:
 *                           type: string
 *                           example: "USR_5be149a20df10d5d"
 *                         entry_type:
 *                           type: string
 *                           example: "entry"
 *                         note:
 *                           type: string
 *                           example: "test deneme açıklama 123456"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-05T06:00:00.000Z"
 *                         name:
 *                           type: string
 *                           example: "Fatih Gençal"
 *                     exit:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "ENT_7a126a0f1aa5b617"
 *                         user_id:
 *                           type: string
 *                           example: "USR_5be149a20df10d5d"
 *                         entry_type:
 *                           type: string
 *                           example: "exit"
 *                         note:
 *                           type: string
 *                           example: "test deneme açıklama 123456"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-05T15:00:00.000Z"
 *                         name:
 *                           type: string
 *                           example: "Fatih Gençal"
 *       400:
 *         description: Hatalı istek (giriş-çıkış uyumsuzluğu, firma uyumsuzluğu, tip uyumsuzluğu)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *       401:
 *         description: Kimlik doğrulama hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *       403:
 *         description: Yetki hatası (can_view_users_work_status yetkisi gerekli)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 */
router.post('/get-user-entry-and-exit', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {entryId, exitId} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        const { data:entryResult } = await getEntryById(entryId);
        const { data:exitResult } = await getEntryById(exitId);

        if ( entryResult.entry.user_id !== exitResult.entry.user_id ) {
            return responseHelper.error(res, t('workStatus:get.entryExitMismatch'), 400);
        }

        if ( entryResult.company.id !== exitResult.company.id){
            return responseHelper.error(res, t('workStatus:get.companyMismatch'), 400);
        }

        if ( userId !== entryResult.entry.user_id ) {
            const hasPermission = await checkUserRoles(userId, entryResult.company.id, ['can_view_users_work_status']);

            if (!hasPermission) {
                return responseHelper.error(res, t('workStatus:get.cannotAccessInCompany'), 403);
            }
        }

        if ( entryResult.entry.entry_type !== 'entry' || exitResult.entry.entry_type !== 'exit' ){
            return responseHelper.error(res, t('workStatus:get.entryExitTypeMismatch'), 400);
        }

        const data = {
            entry: entryResult.entry,
            exit: exitResult.entry
        }

        return responseHelper.success(res, {data});

    } catch (error) {

        if (error.status) {
            return responseHelper.error(res, error.message, error.status);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;