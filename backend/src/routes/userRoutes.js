const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { createUserSchema, updateUserSchema, idParam, listQuery } = require('../validations/userValidation');

router.post('/create', validateBody(createUserSchema), userController.createUser);

router.get('/list', validateQuery(listQuery), userController.listUsers);

router.get('/detail/:id', validateParams(idParam), userController.getUserById);

router.put('/update/:id', validateParams(idParam), validateBody(updateUserSchema), userController.updateUser);

router.patch('/:id/toggle-status', validateParams(idParam), userController.toggleStatus);

module.exports = router;
