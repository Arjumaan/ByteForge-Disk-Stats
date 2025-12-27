const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/hardware', healthController.getHardwareInfo);
router.get('/software', healthController.getSoftwareInfo);

module.exports = router;
