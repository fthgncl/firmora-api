const getBaseUrl = () => {
    const port = process.env.EXPRESS_PORT || '3000';
    return `http://localhost:${port}`;
};

module.exports = {
    getBaseUrl
};