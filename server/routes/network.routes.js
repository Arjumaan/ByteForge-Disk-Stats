const express = require('express');
const router = express.Router();
const controller = require('../controllers/network.controller');

router.get('/details', controller.getNetworkDetails);
router.post('/speedtest', controller.runSpeedTest);

module.exports = router;
