// src/database/oauthKeys/upsertOAuthKey.js
const {generateUniqueId} = require("../../utils/idUtils");
const {queryAsync} = require("../utils/connection"); // ✅ sende hangi mysql wrapper varsa ona göre değiştir

/**
 * provider bazında record varsa update, yoksa insert
 */
async function upsertOAuthKey({
                                  provider,
                                  clientId,
                                  clientSecret,
                                  redirectUri,
                                  accessToken,
                                  refreshToken,
                                  scope,
                                  tokenType,
                                  expiryDate,
                                  isActive = 1
                              }) {

    // provider record var mı?
    const [rows] = await queryAsync(
        `SELECT id FROM oauth_keys WHERE provider = ? LIMIT 1`,
        [provider]
    );

    if (rows && rows.length > 0) {
        const id = rows[0].id;

        await queryAsync(
            `
                UPDATE oauth_keys
                SET client_id     = ?,
                    client_secret = ?,
                    redirect_uri  = ?,
                    access_token  = ?,
                    refresh_token = ?,
                    scope         = ?,
                    token_type    = ?,
                    expiry_date   = ?,
                    is_active     = ?
                WHERE id = ?
            `,
            [
                clientId,
                clientSecret,
                redirectUri,
                accessToken ?? null,
                refreshToken ?? null,
                scope ?? null,
                tokenType ?? null,
                expiryDate ?? null,
                isActive,
                id
            ]
        );

        return { id, updated: true };
    }

    // yoksa insert
    const id = await generateUniqueId('OAK', 'oauth_keys');
    await queryAsync(
        `
    INSERT INTO oauth_keys
      (id, provider, client_id, client_secret, redirect_uri, access_token, refresh_token, scope, token_type, expiry_date, is_active)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            id,
            provider,
            clientId,
            clientSecret,
            redirectUri,
            accessToken ?? null,
            refreshToken ?? null,
            scope ?? null,
            tokenType ?? null,
            expiryDate ?? null,
            isActive
        ]
    );

    return { id, created: true };
}

module.exports = { upsertOAuthKey };
