const express = require('express');
const router = express.Router();
const responseHelper = require('../../utils/responseHelper');
const { t } = require('../../../config/i18nConfig');
const { query } = require('../../../database');

/**
 * @swagger
 * /companies:
 *   delete:
 *     summary: Şirket sil
 *     description: Kullanıcının sahip olduğu bir şirketi siler (firma sahibi olma gerekli)
 *     tags:
 *       - Companies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *             properties:
 *               company_id:
 *                 type: string
 *                 description: Silinecek şirket ID'si
 *                 example: "COM123456"
 *     responses:
 *       200:
 *         description: Şirket başarıyla silindi
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
 *                   example: "Şirket başarıyla silindi"
 *       400:
 *         description: Geçersiz istek
 *       403:
 *         description: Yetki yetersiz (firma sahibi değilsiniz)
 *       404:
 *         description: Şirket bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/', async (req, res) => {
    try {
        // Kullanıcı ID'sini kontrol et
        const userId = req.tokenPayload?.id;
        if (!userId) {
            return responseHelper.error(res, t('auth.tokenRequired'), 401);
        }

        const { company_id } = req.body;
        if (!company_id) {
            return responseHelper.error(res, t('companies.delete.idRequired'), 400);
        }

        // Firmayı veritabanından sorgula
        const companyResult = await query('SELECT owner_id FROM companies WHERE id = ?', [company_id]);

        if (!companyResult || companyResult.length === 0) {
            return responseHelper.error(res, t('companies.delete.notFound'), 404);
        }

        const company = companyResult[0];

        // Kullanıcının firma sahibi olup olmadığını kontrol et
        if (company.owner_id !== userId) {
            return responseHelper.error(res, t('errors:permissions.insufficientPermissions'), 403);
        }

        // Şirketi sil
        await query('DELETE FROM companies WHERE id = ?', [company_id]);

        return responseHelper.success(res, {
            message: t('companies.delete.success')
        });

    } catch (error) {
        console.error('Şirket silme hatası:', error);
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;
