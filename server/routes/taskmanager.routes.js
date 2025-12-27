const router = require('express').Router();
const { getSystemStats, getProcesses } = require('../controllers/taskmanager.controller');

router.get('/stats', getSystemStats);
router.get('/processes', getProcesses);

module.exports = router;
