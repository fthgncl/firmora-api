/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Yeni şirket oluştur
 *     description: Yeni bir şirket oluşturur (create_company yetkisi gerekli)
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - currency
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Şirket adı
 *                 example: "Acme Corporation"
 *               sector:
 *                 type: string
 *                 description: Şirket sektörü
 *                 example: "Technology"
 *               currency:
 *                 type: string
 *                 description: Şirket para birimi
 *                 example: "USD"
 *     responses:
 *       200:
 *         description: Şirket başarıyla oluşturuldu
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
 *                   example: "Şirket başarıyla oluşturuldu"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "COM123456"
 *                         company_name:
 *                           type: string
 *                           example: "Acme Corporation"
 *                         sector:
 *                           type: string
 *                           example: "Technology"
 *                         currency:
 *                           type: string
 *                           example: "USD"
 *       400:
 *         description: Gerekli alanlar eksik
 *       403:
 *         description: Yetki yetersiz (create_company yetkisi gerekli)
 *       409:
 *         description: Şirket adı zaten mevcut
 *       500:
 *         description: Sunucu hatası
 */

const express = require('express');
const router = express.Router();
const createCompany = require('../../../database/companies/createCompany');
const { canUserCreateCompany, setUserPermissions } = require('../../../utils/permissionsManager');
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18n.config');
const { beginTransaction, commit, rollback } = require('../../../database/utils/connection');

router.post('/', async (req, res) => {
    try {
        // Kullanıcı yetkisini kontrol et
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        // Kullanıcının firma oluşturma hakkını kontrol et
        const canCreate = await canUserCreateCompany(userId);
        if (!canCreate.canCreate) {
            return responseHelper.error(
                res,
                canCreate.message || t('permissions:canCreateCompany.cannotCreate'),
                403,
                {
                    maxCompanies: canCreate.maxCompanies,
                    currentCompanyCount: canCreate.currentCompanyCount,
                    remainingSlots: canCreate.remainingSlots
                }
            );
        }

        // Gerekli alanları kontrol et
        const { company_name, currency } = req.body;
        if (!company_name || !currency) {
            return responseHelper.error(res, t('companies:create.fieldsRequired'), 400);
        }

        try {
            // Transaction başlat
            await beginTransaction();

            // Şirket oluştur - owner_id token'dan alınan userId olarak atanır
            const companyData = {
                ...req.body,
                owner_id: userId
            };
            const result = await createCompany(companyData);

            // Kullanıcıya firma sahibi yetkisi ver
            await setUserPermissions(userId, result.company.id, 'a');

            // Transaction'ı onayla
            await commit();

            return responseHelper.success(res, {
                message: result.message,
                company: result.company
            });
        } catch (transactionError) {
            // Hata durumunda rollback yap
            await rollback();
            throw transactionError;
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return responseHelper.error(res, t('companies:create.duplicateError'), 409);
        }

        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
