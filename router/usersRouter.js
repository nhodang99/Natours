const express = require('express');
const controller = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Special route to sign up a new user
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// From this point on, all the below requests need authorization
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', controller.getMe);
router.patch('/updateMe', controller.updateMe);
router.delete('/deleteMe', controller.deleteMe);

// All the below request is executed by admin only
router.use(authController.restrictTo('admin'));

router.route('/').get(controller.getAllUsers);

router
  .route('/:id')
  .get(controller.getUser)
  .patch(controller.updateUser)
  .delete(controller.deleteUser);

module.exports = router;
