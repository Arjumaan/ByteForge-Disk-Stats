const express = require('express');
const router = express.Router();
const appsController = require('../controllers/apps.controller');

router.get('/list', appsController.listApps);
router.get('/icon', appsController.getIcon);
router.post('/uninstall', appsController.uninstallApp);

module.exports = router;
