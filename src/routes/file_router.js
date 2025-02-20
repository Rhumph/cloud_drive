const { Router } = require('express');
const router = Router();
const fileController = require('../controllers/file_controller');

router.get('/', fileController.getAllFiles);
router.post('/create-folder', fileController.makeDirectory);

module.exports = router;

