const express = require('express');
const router = express.Router();

const authRoute = require('./turnstile/auth');


router.use('/', authRoute);


module.exports = router;