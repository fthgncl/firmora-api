const permissions = require('../config/permissionsConfig');
const {queryAsync} = require("../database/utils/connection");
const { t } = require('../config/i18nConfig');

async function readUserPermissions (userId){
    try {
        // Kullanıcıyı ID'ye göre bulmak için sorgu oluştur
        const query = `SELECT permissions FROM users WHERE id = ?`;

        // queryAsync kullan
        const results = await queryAsync(query, [userId]);

        // Sonuç kontrolü
        if (!results || results.length === 0) {
            throw {
                status: 404,
                message: t('permissions.readUser.userNotFound')
            };
        }

        // Başarılı sonucu döndür
        return {
            status: 200,
            message: t('permissions.readUser.success'),
            permissions: results[0].permissions || ''
        };

    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || t('permissions.readUser.error'),
            error
        };
    }
}

async function setUserPermissions(userId, permissions) {
    try {
        const sortedPermissions = alfabetikSirala(permissions);
        const query = `UPDATE users SET permissions = ? WHERE id = ?`;

        await queryAsync(query, [sortedPermissions, userId]);

        return {
            status: true,
            message: t('permissions.setUser.success'),
            newPermissions: sortedPermissions
        };
    } catch (error) {
        throw {
            status: 500,
            message: t('permissions.setUser.error'),
            error
        };
    }
}

function addUserPermissions(userId, newPermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId)
            .then(response => response.permissions)
            .then(userPermissions => {
                for (const permission of newPermissions) {
                    if (permission && userPermissions.indexOf(permission) === -1)
                        userPermissions += permission;
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

function removeUserPermissions(userId, removePermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId)
            .then(response => response.permissions)
            .then(userPermissions => {
                for (const permission of removePermissions) {
                    if (permission)
                        userPermissions = userPermissions.replaceAll(permission, '');
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

function checkRoles(permissionsString) {
    const roles = [];
    for (const key in permissions) {
        if (permissions.hasOwnProperty(key)) {
            if (permissionsString.includes(permissions[key].code)) {
                roles.push(key);
            }
        }
    }

    return roles;
}

async function checkUserRoles(userId, roles = ['sys_admin'], fullMatch = false) {
    try {
        const data = await readUserPermissions(userId);
        const userPermissions = data.permissions;
        const userRoles = checkRoles(userPermissions);

        if (userRoles.includes('sys_admin'))
            return true;

        if (fullMatch)
            return roles.every(role => userRoles.includes(role));    // roles array'ında bulunan her bir index userRoles array'ında da bulunuyorsa true döner
        else
            return roles.some(role => userRoles.includes(role));    // roles array'ında bulunan her hangi bir index userRoles array'ında da bulunuyorsa true döner

    } catch (error) {
        console.error(t('permissions.checkUserRoles.error', { userId }), error);
    }
}

function alfabetikSirala(metin) {
    // Metni diziye dönüştür
    let dizi = metin.split('');

    // Diziyi Set'e dönüştürerek tekrar eden karakterleri kaldır
    let benzersizDizi = Array.from(new Set(dizi));

    // Diziyi alfabetik olarak sırala
    let siralanmisDizi = benzersizDizi.sort();

    // Alfabetik sıralanmış diziyi birleştirerek sonucu oluştur
    return siralanmisDizi.join('');
}

module.exports = {readUserPermissions, checkUserRoles, addUserPermissions,removeUserPermissions};
