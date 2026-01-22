const express = require('express');
const router = express.Router();
const responseHelper = require('../utils/responseHelper');

const {
    getGoogleOAuthClientFromDb,
    buildGoogleAuthUrl,
    exchangeCodeAndPersistTokens
} = require('../../services/googleOAuthService');

router.get('/google/auth', async (req, res) => {
    const {oAuth2Client} = await getGoogleOAuthClientFromDb();
    const url = buildGoogleAuthUrl(oAuth2Client);
    return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return responseHelper.error(res, 'Missing code', 400);

    await exchangeCodeAndPersistTokens(code);
    return responseHelper.success(res, {
        message: 'Google tokenlar DB’ye kaydedildi.'
    });
});

module.exports = router;
