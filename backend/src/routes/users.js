const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

// All user management operations require token authentication
router.use(verifyToken);

router.get('/', checkPermission('create_user'), userController.getAllUsers);
router.post('/', checkPermission('create_user'), userController.createUser);
router.get('/:id', checkPermission('create_user'), userController.getUserById);
router.put('/:id', checkPermission('create_user'), userController.updateUser);
router.patch('/:id/status', checkPermission('deactivate_user'), userController.toggleUserStatus);

module.exports = router;
