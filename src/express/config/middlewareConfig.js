const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../config/swagger');
const { generalRateLimit } = require('../middleware/rateLimitMiddleware');
const languageMiddleware = require('../middleware/languageMiddleware');

const setupMiddlewares = (app) => {
    // Güvenlik ve rate limiting
    app.use(generalRateLimit); // Rate limiting - Genel hız sınırlama

    // CORS konfigürasyonu
    app.use(cors());

    // HTTP istek loglama
    app.use(morgan('dev'));

    // Dil desteği middleware'i - tüm route'larda dil desteği
    app.use(languageMiddleware);

    // Body parsing middleware'ları
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // API dokümantasyonu
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = { setupMiddlewares };