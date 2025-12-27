const router = require('express').Router();
const { readRegistry } = require('../controllers/registry.controller');

router.get('/', readRegistry);

module.exports = router;
