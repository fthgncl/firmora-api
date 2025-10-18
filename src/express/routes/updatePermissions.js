const express = require('express');
const router = express.Router();
const responseHelper = require('../utils/responseHelper');
const {t} = require('../../config/i18nConfig');
const {readUserPermissions, checkUserRoles, setUserPermissions, checkRoles} = require('../../utils/permissionsManager');
const {getCompaniesByOwnerId} = require("../../database/companies");

/**
 * @swagger
 * /update-permissions:
 *   post:
 *     summary: Kullanıcı yetkilerini güncelle
 *     description: Belirli bir firmadaki kullanıcının yetkilerini günceller. Bu işlemi yapabilmek için personnel_manager yetkisi gereklidir.
 *     tags:
 *       - Permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUserId
 *               - companyId
 *               - permissions
 *             properties:
 *               targetUserId:
 *                 type: string
 *                 description: Yetkileri güncellenecek kullanıcının ID'si
 *                 example: "user123"
 *               companyId:
 *                 type: string
 *                 description: Firma ID'si
 *                 example: "company456"
 *               permissions:
 *                 type: string
 *                 description: Atanacak yetki kodları (örn. "abdel")
 *                 example: "abdel"
 *     responses:
 *       200:
 *         description: Yetkiler başarıyla güncellendi
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
 *                       example: "Yetkiler güncellendi"
 *                     targetUserId:
 *                       type: string
 *                       example: "user123"
 *                     companyId:
 *                       type: string
 *                       example: "company456"
 *                     requestedPermissions:
 *                       type: string
 *                       example: "abdel"
 *       400:
 *         description: Geçersiz istek - Eksik veya hatalı parametreler
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
 *                   example: "Hedef kullanıcı ID'si belirtilmelidir."
 *       401:
 *         description: Yetkisiz erişim - Token eksik veya geçersiz
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
 *                   example: "Token sağlanmadı."
 *       403:
 *         description: Yasak - Yetersiz yetki veya kendi yetkilerini güncelleme girişimi
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
 *                   example: "Bu işlem için gerekli izne sahip değilsiniz."
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
 *                   example: "Yetkiler güncellenirken bir hata oluştu."
 */
router.post('/', async (req, res) => {
    try {
        // İstek sahibinin kimliğini token'dan al
        const userId = req.tokenPayload?.id;

        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Body'den gerekli bilgileri al
        const {targetUserId, companyId, permissions: requestedPermissions} = req.body;

        // Validasyonlar
        if (!targetUserId) {
            return responseHelper.error(res, t('errors:validation.targetUserIdRequired'), 400);
        }

        if (!companyId) {
            return responseHelper.error(res, t('errors:validation.companyIdRequired'), 400);
        }

        if (!requestedPermissions || typeof requestedPermissions !== 'string') {
            return responseHelper.error(res, t('errors:validation.permissionsRequired'), 400);
        }

        // Kullanıcı kendi yetkilerini güncelleyemez
        if (userId === targetUserId) {
            return responseHelper.error(res, t('errors:permissions.cannotUpdateOwnPermissions'), 403);
        }

        const ownedCompanies = await getCompaniesByOwnerId(userId);
        const ownedCompanyIds = ownedCompanies.map(c => c.id);
        const isCompanyOwner = ownedCompanyIds.includes(companyId);

        if (!isCompanyOwner) { // Eğer kullanıcı firma sahibi ise yetki kontrollerini atla

            // personnel_manager yetkisini kontrol et
            const hasPermission = await checkUserRoles(userId, companyId, ['personnel_manager']);

            if (!hasPermission) {
                return responseHelper.error(res, t('errors:permissions.insufficientPermissions'), 403);
            }

            // Hedef kullanıcının dokunulmazlık yetkisi var mı kontrol et
            const targetHasImmunity = await checkUserRoles(targetUserId, companyId, ['immunity']);
            if (targetHasImmunity) {
                return responseHelper.error(res, t('errors:permissions.cannotModifyImmunityUser'), 403);
            }


            // İstek sahibinin yetkilerini al
            const userPermissionsResult = await readUserPermissions(userId, companyId);

            if (!userPermissionsResult || !userPermissionsResult.permissions || userPermissionsResult.permissions.length === 0) {
                return responseHelper.error(res, t('errors:permissions.noPermissionsFound'), 403);
            }

            const userPermissionsString = userPermissionsResult.permissions[0].permissions || '';
            const hasSysAdmin = checkRoles(userPermissionsString).includes('sys_admin');

            // Atanmak istenen her yetkinin istek sahibinde olup olmadığını kontrol et
            if (!hasSysAdmin) {
                for (const permission of requestedPermissions) {
                    if (!userPermissionsString.includes(permission)) {
                        return responseHelper.error(
                            res,
                            t('errors:permissions.cannotAssignPermissionYouDontHave', {permission}),
                            403
                        );
                    }
                }
            }

        }

        await setUserPermissions(targetUserId, companyId, requestedPermissions);

        return responseHelper.success(res, {
            message: t('permissions:updatePermissions.success'),
            targetUserId,
            companyId,
            requestedPermissions
        });

    } catch (error) {
        console.error('Update permissions error:', error);
        return responseHelper.error(
            res,
            error.message || t('errors:permissions.updateFailed'),
            error.status || 500
        );
    }
});

module.exports = router;