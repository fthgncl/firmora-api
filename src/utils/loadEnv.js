// TODO: Sunucu ortamında .env.production dosyası içeriğindeki değişkenler şifreleyerek saklanmalı. ilgili döküman dotenvx.com'da mevcut.

const dotenv = require('dotenv');

// Birden fazla env dosyasını sırasıyla yüklemek için helper fonksiyon
function loadMultipleEnvFiles(paths) {


    paths.forEach( path => {
        const result = dotenv.config({
            path: path,
            override: true
        });

        if (result.error) {
            throw new Error(`${path} dosyası yüklenemedi: ${result.error.message}`);
        }

    });
}

function loadEnv() {
    return new Promise((resolve, reject) => {
        const lifecycle = process.env.npm_lifecycle_event;

        switch (lifecycle) {
            case 'test':
                try {
                    loadMultipleEnvFiles(['.env.development', '.env.test']);
                    return resolve({
                        status: 'success',
                        message: '.env.development ve .env.test dosyalarından ortam değişkenleri yüklendi.',
                    });
                } catch (error) {
                    return reject({
                        status: 'error',
                        message: error.message,
                        error: error,
                    });
                }

            case 'start:dev':
                const devResult = dotenv.config({
                    path: '.env.development',
                    override: true
                });

                if (devResult.error) {
                    return reject({
                        status: 'error',
                        message: '.env.development dosyası yüklenemedi.',
                        error: devResult.error,
                    });
                }

                return resolve({
                    status: 'success',
                    message: '.env.development dosyasından ortam değişkenleri yüklendi.',
                });

            case 'start':
                const prodResult = dotenv.config({
                    path: '.env.production',
                    override: true
                });

                if (prodResult.error) {
                    return reject({
                        status: 'error',
                        message: '.env.production dosyası yüklenemedi.',
                        error: prodResult.error,
                    });
                }

                return resolve({
                    status: 'success',
                    message: '.env.production dosyasından ortam değişkenleri yüklendi.',
                });

            default:
                return reject({
                    status: 'error',
                    message: `Bilinmeyen npm lifecycle event: ${lifecycle}. Desteklenen değerler: test, start:dev, start`,
                    error: new Error('Unsupported lifecycle event'),
                });
        }
    });
}

module.exports = loadEnv;