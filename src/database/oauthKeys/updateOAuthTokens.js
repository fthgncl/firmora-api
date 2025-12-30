// src/database/oauthKeys/updateOAuthTokens.js
const { queryAsync } = require('../utils/connection');

async function updateOAuthTokens({
                                     id,
                                     access_token,
                                     refresh_token,
                                     scope,
                                     token_type,
                                     expiry_date
                                 }) {
    return queryAsync(
        `
    UPDATE oauth_keys SET
      access_token = ?,
      refresh_token = ?,
      scope = ?,
      token_type = ?,
      expiry_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
        [
            access_token ?? null,
            refresh_token ?? null,
            scope ?? null,
            token_type ?? null,
            expiry_date ?? null,
            id
        ]
    );
}

module.exports = { updateOAuthTokens };
