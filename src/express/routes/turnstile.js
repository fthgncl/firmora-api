const express = require('express');
const router = express.Router();

const authRoute = require('./turnstile/auth');
const getTokenRoute = require('./turnstile/getToken');
const scanRoute = require('./turnstile/scan');

router.use('/', authRoute);
router.use('/', getTokenRoute);
router.use('/', scanRoute);

module.exports = router;