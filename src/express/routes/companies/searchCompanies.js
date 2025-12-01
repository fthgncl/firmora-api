/**
 * @swagger
 * /companies/search:
 *   get:
 *     summary: Firmaları arar
 *     description: Firma adı veya sektör bilgisine göre firma arar. Sayfalama ve sıralama destekler.
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Aranacak terim (firma adı veya sektör)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Sayfa başına sonuç sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Atlanacak kayıt sayısı
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sayfa numarası (offset yerine kullanılabilir)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [company_name, sector, currency, created_at]
 *           default: company_name
 *         description: Sıralama alanı
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sıralama yönü
 *     responses:
 *       200:
 *         description: Firmalar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Firmalar başarıyla getirildi
 *                 data:
 *                   type: object
 *                   properties:
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           company_name:
 *                             type: string
 *                           sector:
 *                             type: string
 *                           currency:
 *                             type: string
 *                           owner_id:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       400:
 *         description: Geçersiz parametreler
 *       500:
 *         description: Sunucu hatası
 */

const express = require('express');
const router = express.Router();
const { searchCompanies } = require('../../../database/companies/searchCompanies');
const { t } = require('../../../config/i18n.config');

router.get('/', async (req, res) => {
    try {
        const {
            searchTerm,
            limit,
            offset,
            page,
            sortBy,
            sortOrder
        } = req.query;

        let calculatedOffset = offset;
        if (page && !offset) {
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit) || 20;
            calculatedOffset = (pageNum - 1) * limitNum;
        }

        const searchOptions = {
            searchTerm: searchTerm || '',
            limit: limit || 20,
            offset: calculatedOffset || 0,
            sortBy: sortBy || 'company_name',
            sortOrder: sortOrder || 'ASC'
        };

        const result = await searchCompanies(searchOptions);
        return res.status(result.status).json(result);

    } catch (error) {
        console.error('Firma arama hatası:', error);
        return res.status(error.status || 500).json({
            status: error.status || 500,
            message: error.message || t('companies:search.error'),
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});

module.exports = router;
