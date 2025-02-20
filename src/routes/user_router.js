const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');

router.get('/', userController.getLoginPage);
router.get('/create-user', userController.getCreateUserPage);
router.post('/create-user', userController.handleCreateUser);
router.get('/login', userController.getLoginPage);
router.post('/login', userController.handleLogin);

module.exports = router;