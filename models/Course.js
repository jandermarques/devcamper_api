const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Prease add a course title'],
  },
  description: {
    type: String,
    required: [true, 'Prease add a course description'],
  },
  weeks: {
    type: String,
    required: [true, 'Prease add a number of weeks'],
  },
  tuition: {
    type: Number,
    required: [true, 'Prease add a tuition cost'],
  },
  minimumSkill: {
    type: String,
    required: [true, 'Prease add a minimun skill'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  scholarhipsAvailable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
});

module.exports = mongoose.model('Course', CourseSchema);
