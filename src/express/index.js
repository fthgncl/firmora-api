const express = require('express');
const { setupMiddlewares } = require('./config/middlewareConfig');
const { setupRoutes } = require('./config/routeConfig');
const { setupErrorHandlers } = require('./config/errorConfig');
const { setupPort } = require('./config/serverConfig');
const { startServer } = require('./services/serverService');

async function startExpressApp() {
    try {
        // Express uygulaması oluştur
        const app = express();

        // Middleware'ları konfigüre et
        setupMiddlewares(app);

        // Rotaları konfigüre et
        setupRoutes(app);

        // Hata işleyicilerini konfigüre et
        setupErrorHandlers(app);

        // Port ayarlarını yap
        const port = setupPort(app);

        // Sunucuyu başlat
        return await startServer(app, port);

    } catch (error) {
        throw {
            status: 'error',
            message: `Express uygulaması başlatılırken hata oluştu: ${error.message}`,
            originalError: error
        };
    }
}

module.exports = startExpressApp;