const express = require('express');
const router = express.Router();
const { getCompanyById } = require('../../../database/companies');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');
const {checkUserRoles, setUserPermissions, readUserPermissions} = require("../../../utils/permissionsManager");
const getUserById = require("../../../database/users/getUserById");

/**
 * @swagger
 * /companies/add-user:
 *   post:
 *     summary: Firmaya kullanıcı ekle
 *     description: Belirtilen kullanıcıyı firmaya ekler ve yetkilendirme yapar
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - userId
 *               - permissions
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Firma ID'si
 *                 example: "COM_547dc37210f0157d"
 *               userId:
 *                 type: string
 *                 description: Kullanıcı ID'si
 *                 example: "USR_f1eb361f6dcd6ba4"
 *               permissions:
 *                 type: string
 *                 description: Kullanıcı yetkileri (a=sys_admin, b=personnel_manager, c=can_transfer_money, d=can_transfer_external)
 *                 example: "a"
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla firmaya eklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı başarıyla firmaya eklendi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     companyId:
 *                       type: string
 *                       example: "COM_547dc37210f0157d"
 *                     userId:
 *                       type: string
 *                       example: "USR_f1eb361f6dcd6ba4"
 *                     permissions:
 *                       type: string
 *                       example: "a"
 *       400:
 *         description: Gerekli alanlar eksik veya kullanıcı zaten firmada mevcut
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı zaten firmada mevcut"
 *       403:
 *         description: Yetkisiz erişim - Personnel manager yetkisi gerekli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Bu işlem için yetkiniz bulunmamaktadır"
 *       404:
 *         description: Kullanıcı veya firma bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bulunamadı"
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
 *                 message:
 *                   type: string
 *                   example: "Sunucu hatası"
 */
router.post('/add-user', async (req, res) => {
    try {

        const userId = req.tokenPayload?.id;
        const { userId: newEmployeeId, companyId, permissions } = req.body;

        if (!companyId || !newEmployeeId || !permissions) {
            return responseHelper.error(res, t('companies.addUser.fieldsRequired'), 400);
        }

        // Kullanıcının kendisini firmaya eklemeye çalışıp çalışmadığını kontrol et
        if (userId === newEmployeeId) {
            return responseHelper.error(res, t('companies.addUser.cannotAddSelf'), 400);
        }

        // TODO: kullanıcı kendisinde olmayan yetkiyi oluşturduğu kullanıcıya veremesin
        const hasPermission = await checkUserRoles(userId, companyId,['personnel_manager']);
        if (!hasPermission) {
            return responseHelper.error(res, t('permissions.insufficientPermissions'), 403);
        }



        // Kullanıcının var olup olmadığını kontrol et
        const newEmployee = await getUserById(newEmployeeId, ['id']);
        if (!newEmployee) {
            return responseHelper.error(res, t('companies.addUser.userNotFound'), 404);
        }

        // Firmanın var olup olmadığını kontrol et
        const company = await getCompanyById(companyId, ['id']);
        if (!company) {
            return responseHelper.error(res, t('companies.addUser.companyNotFound'), 404);
        }

        // Kullanıcının firmada zaten yetkisi olup olmadığını kontrol et
        const existingPermissions = await readUserPermissions(newEmployeeId, companyId);
        if (existingPermissions.permissions && existingPermissions.permissions.length > 0) {
            return responseHelper.error(res, t('companies.addUser.userAlreadyExists'), 400);
        }

        // Kullanıcıyı firmaya ekle ve yetkilerini ayarla
        const result = await setUserPermissions(newEmployeeId, companyId, permissions);

        return responseHelper.success(res, {
            message: result.message,
            companyId: result.companyId,
            userId: newEmployeeId,
            permissions: result.newPermissions
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
