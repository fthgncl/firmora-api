const jwt = require('jsonwebtoken');

function createToken(payload = {}, tokenLife = process.env.TOKEN_LIFETIME ) {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: tokenLife });
}

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                return reject(err);
            }

            delete decoded.iat;
            delete decoded.exp;
            resolve(decoded);
        });
    });
}

function refreshToken(token) {
    return verifyToken(token)
        .then(decodedToken => {
            const tokenLife = decodedToken.rememberMe ? process.env.REMEMBER_ME_TOKEN_LIFETIME : process.env.TOKEN_LIFETIME;
            return createToken(decodedToken, tokenLife);
        })
        .catch(() => false);
}

module.exports = { createToken, verifyToken, refreshToken };