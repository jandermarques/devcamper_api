const express = require('express');

const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  uploadPhotoBootcamp,
} = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');

// Include other resource routers
const courseRouter = require('./courses');

const router = express.Router();

const { protect, authorized } = require('../middleware/auth');

// Re-route in to other resource routers
router.use('/:bootcampId/courses', courseRouter);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorized('publisher', 'admin'), createBootcamp);

router
  .route('/:id/photo')
  .put(protect, authorized('publisher', 'admin'), uploadPhotoBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorized('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorized('publisher', 'admin'), deleteBootcamp);

module.exports = router;
