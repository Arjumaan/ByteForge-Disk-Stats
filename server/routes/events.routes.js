const router = require('express').Router();
const { readEvents } = require('../controllers/events.controller');

router.get('/', readEvents);

module.exports = router;
