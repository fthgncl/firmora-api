const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../config/swagger');
const { generalRateLimit } = require('../middleware/rateLimitMiddleware');

const setupMiddlewares = (app) => {
    // Güvenlik ve rate limiting
    app.use(generalRateLimit); // Rate limiting - Genel hız sınırlama

    // CORS konfigürasyonu
    app.use(cors());

    // HTTP istek loglama
    app.use(morgan('dev'));

    // Body parsing middleware'ları
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // API dokümantasyonu
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = { setupMiddlewares };