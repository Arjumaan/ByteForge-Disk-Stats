const express = require('express');
const router = express.Router();
const diskController = require('../controllers/diskController');

router.get('/overview', diskController.getDiskOverview);
router.get('/scan', diskController.scanDirectory);
router.post('/cleanup', diskController.cleanupItems);

module.exports = router;
