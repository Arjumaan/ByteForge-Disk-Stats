const express = require('express');
const router = express.Router();
const cleanupController = require('../controllers/cleanup.controller');

router.get('/scan', cleanupController.scan);
router.post('/execute', cleanupController.execute);

module.exports = router;
