var express    = require('express');
var router     = express.Router();
var controller = require('./controller.js');

/* GET home page. */
router.get('/', controller.index);

router.post('/new/property', controller.property);

router.post('/new/sample', controller.sample);

router.get('/create', controller.create);

router.post('/clear', controller.clear);

module.exports = router;
