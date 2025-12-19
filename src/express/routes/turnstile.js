const express = require('express');
const router = express.Router();

const authRoute = require('./turnstile/auth');
const getTokenRoute = require('./turnstile/getToken');

router.use('/', authRoute);
router.use('/', getTokenRoute);

module.exports = router;