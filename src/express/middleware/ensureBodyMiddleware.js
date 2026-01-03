const ensureBodyMiddleware = (req, res, next) => {
    if (!req.body) {
        req.body = {};
    }
    next();
};

module.exports = ensureBodyMiddleware;
