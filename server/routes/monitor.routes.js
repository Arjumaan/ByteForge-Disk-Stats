const express = require('express');
const router = express.Router();
const monitorController = require('../controllers/monitor.controller');

router.get('/stats', monitorController.getStats);
router.post('/start', monitorController.start);
router.post('/stop', monitorController.stop);

module.exports = router;
