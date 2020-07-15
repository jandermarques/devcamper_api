const express = require('express');

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courses');

const Course = require('../models/Course');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router({ mergeParams: true });

const { protect, authorized } = require('../middleware/auth');

router
  .route('/')
  .get(
    advancedResults(Course, {
      path: 'bootcamp',
      select: 'name description',
    }),
    getCourses
  )
  .post(protect, authorized('publisher', 'admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorized('publisher', 'admin'), updateCourse)
  .delete(protect, authorized('publisher', 'admin'), deleteCourse);

module.exports = router;
