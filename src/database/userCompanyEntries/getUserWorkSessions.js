const getUserEntries = require('./getUserEntries');

/**
 * Kullanıcının belirli tarihler arasındaki çalışma seanslarını hesaplar
 * Her entry-exit çiftini eşleştirir ve aralarındaki süreyi hesaplar
 * @param {string} userId - Kullanıcı ID
 * @param {string} companyId - Şirket ID
 * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD formatında)
 * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD formatında)
 * @returns {Promise<Array>} Çalışma seansları [{entryTime, exitTime, durationMinutes}, ...]
 */
const getUserWorkSessions = async (userId, companyId, startDate, endDate) => {
    const entries = await getUserEntries(userId, companyId, startDate, endDate);

    const sessions = [];
    let currentEntry = null;

    for (const record of entries) {
        if (record.entry_type === 'entry') {
            currentEntry = record;
        } else if (record.entry_type === 'exit' && currentEntry) {
            const entryTime = new Date(currentEntry.created_at);
            const exitTime = new Date(record.created_at);
            const durationMinutes = Math.round((exitTime - entryTime) / (1000 * 60));

            sessions.push({
                entryTime: currentEntry.created_at,
                exitTime: record.created_at,
                durationMinutes,
                entryNote: currentEntry.note,
                exitNote: record.note
            });

            currentEntry = null;
        }
    }

    // Eğer açık bir entry varsa (henüz exit yapılmamış)
    if (currentEntry) {
        sessions.push({
            entryTime: currentEntry.created_at,
            exitTime: null,
            durationMinutes: null,
            entryNote: currentEntry.note,
            exitNote: null,
            isOpen: true
        });
    }

    return sessions;
};

module.exports = getUserWorkSessions;
