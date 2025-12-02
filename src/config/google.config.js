module.exports = {
    credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    },
    tokens: {
        accessToken: process.env.GOOGLE_ACCESS_TOKEN,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        scope: process.env.GOOGLE_SCOPE,
        tokenType: process.env.GOOGLE_TOKEN_TYPE,
        expiryDate: process.env.GOOGLE_EXPIRY_DATE
    },

    // Yedeklenecek local klasörler (proje root’una göre)
    backupFolders: [
        'backups',
        'uploads'
    ],

    drive: {
        // Tüm yedeklerin altına gireceği ana klasör
        rootFolderName: `${process.env.PROJECT_NAME} Backups`,
    }
};
