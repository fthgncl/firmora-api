const express = require('express');
const router = express.Router();
const getUserById = require('../../../database/users/getUserById');
const responseHelper = require('../../utils/responseHelper');
const {t} = require('../../../config/i18n.config');
const {checkUserRoles} = require("../../../utils/permissionsManager");
const {createToken} = require("../../../auth/jwt");

router.post('/auth', async (req, res) => {
    try {
        const userId = req.tokenPayload?.id;
        const {companyId} = req.body;

        // Token kontrolü
        if (!userId) {
            return responseHelper.error(res, t('errors:auth.tokenMissing'), 401);
        }

        if (!companyId) {
            return responseHelper.error(res, t('turnstile:turnstileMode.companyIdRequired'), 400);
        }

        const hasTurnstileRole = await checkUserRoles(userId, companyId, ['can_act_as_turnstile'])

        if (!hasTurnstileRole) {
            return responseHelper.error(res, t('turnstile:turnstileMode.forbidden'), 403);
        }

        const user = await getUserById(userId,['id','name','surname']);

        const turnstileTokenPayload = {
            company_id: companyId,
            createdBy: user
        };


        const token = createToken(turnstileTokenPayload, process.env.TURNSTILE_AUTH_TOKEN_LIFETIME )

        return responseHelper.success(res, {
            message: t('turnstile:turnstileMode.enabled'),
            token
        });

    } catch (error) {
        return responseHelper.serverError(res, error);
    }
});

module.exports = router;

