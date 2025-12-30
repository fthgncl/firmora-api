// src/database/oauthKeys/getOAuthKeyByProvider.js
const {queryAsync} = require("../utils/connection");

async function getOAuthKeyByProvider(provider) {
    const [rows] = await queryAsync(
        `SELECT * FROM oauth_keys WHERE provider = ? LIMIT 1`,
        [provider]
    );
    return rows?.[0] || null;
}

module.exports = { getOAuthKeyByProvider };
