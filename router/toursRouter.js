const express = require('express');
const controller = require('../controllers/tourController');

const router = express.Router();

// router.param('id', controller.checkId);

router
  .route('/top-5-cheap')
  .get(controller.aliasTopTour, controller.getAllTours);

router.route('/tour-stats').get(controller.getTourStats);
router.route('/monthly-plan/:year').get(controller.getMonthlyPlan);

router.route('/').get(controller.getAllTours).post(controller.createTour);

router
  .route('/:id')
  .get(controller.getTour)
  .patch(controller.updateTour)
  .delete(controller.deleteTour);

module.exports = router;
