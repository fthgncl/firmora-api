// src/database/oauthKeys/getActiveOAuthKey.js
const { queryAsync } = require('../utils/connection');

async function getActiveOAuthKey(provider) {
    const rows = await queryAsync(
        `
    SELECT *
    FROM oauth_keys
    WHERE provider = ? AND is_active = 1
    ORDER BY updated_at DESC
    LIMIT 1
    `,
        [provider]
    );

    return rows?.[0] || null;
}

module.exports = { getActiveOAuthKey };
