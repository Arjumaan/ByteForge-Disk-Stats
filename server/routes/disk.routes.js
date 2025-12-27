const express = require('express');
const router = express.Router();
const diskController = require('../controllers/disk.controller');

router.get('/overview', diskController.getOverview);
router.post('/scan', diskController.startScan);

module.exports = router;
