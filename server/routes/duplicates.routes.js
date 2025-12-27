const express = require('express');
const router = express.Router();
const controller = require('../controllers/duplicates.controller');

router.post('/scan', controller.findDuplicates);

module.exports = router;
