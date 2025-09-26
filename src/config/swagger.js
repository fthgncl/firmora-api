const swaggerJSDoc = require('swagger-jsdoc');
const { getBaseUrl } = require('../express/utils/urlHelper');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: `${process.env.PROJECT_NAME || 'API'} Documentation`,
            version: '1.0.0',
            description: `${process.env.PROJECT_NAME || 'API'} Documentation generated automatically.`,
        },
        servers: [
            {
                url: getBaseUrl(),
            },
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-access-token',
                    description: 'API key authentication'
                }
            }
        },
        security: [
            {ApiKeyAuth: []}
        ]
    },

    apis: [
        'src/express/routes/*.js',
        'src/express/routes/profile/*.js',
        'src/express/middleware/*.js',
    ],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;