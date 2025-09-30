const express = require('express');
const router = express.Router();
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');
const getCompaniesByOwnerId = require('../../../database/companies/getCompaniesByOwnerId');

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Kullanıcının şirketlerini listele
 *     description: Giriş yapmış kullanıcının sahip olduğu tüm şirketleri listeler
 *     tags:
 *       - Companies
 *     responses:
 *       200:
 *         description: Şirketler başarıyla listelendi
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
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Token gerekli
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', async (req, res) => {
    try {
        // Kullanıcı ID'sini al
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        // Kullanıcının sahip olduğu şirketleri getir
        const fields = ['id', 'company_name', 'sector', 'currency', 'balance', 'owner_id', 'created_at'];
        const companies = await getCompaniesByOwnerId(userId, fields);

        return responseHelper.success(res, {
            companies: companies
        });

    } catch (error) {
        console.error('Şirketleri listeleme hatası:', error);
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
