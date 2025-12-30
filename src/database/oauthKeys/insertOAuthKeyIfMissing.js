const { queryAsync } = require('../utils/connection');
const { generateUniqueId } = require('../../utils/idUtils');

async function upsertOAuthKeyFromEnv({ provider, clientId, clientSecret, redirectUri }) {
    const existing = await queryAsync(
        `SELECT id FROM oauth_keys WHERE provider = ? LIMIT 1`,
        [provider]
    );

    if (existing?.length) {
        const id = existing[0].id;

        await queryAsync(
            `
      UPDATE oauth_keys SET
        client_id = ?,
        client_secret = ?,
        redirect_uri = ?,
        is_active = 1
      WHERE id = ?
      `,
            [clientId, clientSecret, redirectUri, id]
        );

        return { inserted: false, updated: true, id };
    }

    const id = await generateUniqueId('OAK', 'oauth_keys');

    await queryAsync(
        `
            INSERT INTO oauth_keys (id, provider, client_id, client_secret, redirect_uri, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `,
        [id, provider, clientId, clientSecret, redirectUri]
    );

    return { inserted: true, updated: false, id };
}

module.exports = { upsertOAuthKeyFromEnv };
