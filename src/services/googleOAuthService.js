// src/services/oauth/googleOAuthService.js

const { google } = require('googleapis');
const {queryAsync} = require("../database/utils/connection");
const { upsertOAuthKeyFromEnv } = require('../database/oauthKeys/insertOAuthKeyIfMissing');

async function ensureGoogleKeyInDbFromEnv() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI .env içinde eksik veya process.env’e yüklenmemiş.');
    }

    return upsertOAuthKeyFromEnv({
        provider: 'google',
        clientId,
        clientSecret,
        redirectUri
    });
}

async function getActiveGoogleKey() {
    // 1) Yoksa env’den insert et
    await ensureGoogleKeyInDbFromEnv();

    // 2) Aktif kaydı çek
    const rows = await queryAsync(
        `
            SELECT *
            FROM oauth_keys
            WHERE provider = 'google' AND is_active = 1
            ORDER BY updated_at DESC
            LIMIT 1
        `
    );

    return rows?.[0] || null;
}

async function updateGoogleTokens(id, tokens, fallbackKey) {
    const refresh = tokens.refresh_token || fallbackKey.refresh_token || null;

    await queryAsync(
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
            tokens.access_token || fallbackKey.access_token || null,
            refresh,
            tokens.scope || fallbackKey.scope || null,
            tokens.token_type || fallbackKey.token_type || null,
            tokens.expiry_date || fallbackKey.expiry_date || null,
            id
        ]
    );

    return { hasRefreshToken: !!refresh };
}

async function getGoogleOAuthClientFromDb() {
    const key = await getActiveGoogleKey();
    if (!key) {
        // Ekstra debug: google provider var mı?
        const any = await queryAsync(`SELECT id, provider, is_active FROM oauth_keys WHERE provider='google' LIMIT 5`);
        console.log('[GoogleOAuth] No active key. Existing google rows:', any);
        throw new Error('Aktif Google OAuth anahtarı bulunamadı (oauth_keys).');
    }

    const oAuth2Client = new google.auth.OAuth2(key.client_id, key.client_secret, key.redirect_uri);

    oAuth2Client.setCredentials({
        access_token: key.access_token || undefined,
        refresh_token: key.refresh_token || undefined,
        scope: key.scope || undefined,
        token_type: 'Bearer',
        expiry_date: key.expiry_date || undefined
    });

    // token yenilenirse DB’ye yaz
    oAuth2Client.on('tokens', async (tokens) => {
        try {
            await updateGoogleTokens(key.id, tokens, key);
        } catch (e) {
            console.warn('[GoogleOAuth] Token DB update failed:', e?.message || e);
        }
    });

    return { oAuth2Client, key };
}

function buildGoogleAuthUrl(oAuth2Client) {
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/drive.file']
    });
}

async function exchangeCodeAndPersistTokens(code) {
    const { oAuth2Client, key } = await getGoogleOAuthClientFromDb();
    const { tokens } = await oAuth2Client.getToken(code);

    const { hasRefreshToken } = await updateGoogleTokens(key.id, tokens, key);
    return { keyId: key.id, hasRefreshToken, expiryDate: tokens.expiry_date || null };
}

module.exports = {
    ensureGoogleKeyInDbFromEnv,
    getGoogleOAuthClientFromDb,
    buildGoogleAuthUrl,
    exchangeCodeAndPersistTokens
};
