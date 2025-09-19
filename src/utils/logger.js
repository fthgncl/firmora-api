const fs = require('fs');
const path = require('path');

async function logError(message, error = null) {
    // Tarih formatını oluştur
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDateTime = `${day}.${month}.${year} | ${hours}:${minutes}`;

    // Log dosyası için tarih
    const today = `${year}-${month}-${day}`; // YYYY-MM-DD formatında
    const logFileName = `error-${today}.log`;
    const logsDir = path.join(__dirname, '../../logs');
    const logFilePath = path.join(logsDir, logFileName);

    // Log dizini oluşturma
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Log mesajı oluşturma
    const logMessage = `[ ${formattedDateTime} ]\n${message}${
        error ? `\nDetails: ${error.stack || JSON.stringify(error, null, 2)}` : ''
    }\n\n\n`;

    console.error(logMessage);

    // Log dosyasına yazma işlemini bekleyin
    try {
        await fs.promises.appendFile(logFilePath, logMessage);
    } catch (err) {
        console.error(`[${formattedDateTime}] Log dosyasına yazılamadı: ${err.stack}`);
    }

    return logMessage;
}

module.exports = logError;