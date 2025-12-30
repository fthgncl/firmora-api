module.exports = {
    credentials: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI
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
