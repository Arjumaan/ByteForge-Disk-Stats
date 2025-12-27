const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');

router.get('/download', reportsController.generateReport);

module.exports = router;
