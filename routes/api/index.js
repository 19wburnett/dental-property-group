const express = require('express');
const router = express.Router();

router.use('/', require('./analyze-lease'));

module.exports = router; 