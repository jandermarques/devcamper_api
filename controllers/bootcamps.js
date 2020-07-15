const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');

// @desc   Get all bootcamps
// @route  Get /api/v1/bootcamps
// @access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc Get single bootcamp
// @route Get /api/v1/getBootcamps/:id
// @access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of '${req.params.id}'.`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// @desc Create new bootcamp
// @route Post /api/v1/getBootcamps
// @access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // Add user to req, body
  req.body.user = req.user.id;

  // Check for published bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  // If the user is not admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a bootcamp.`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({ success: true, data: bootcamp });
});

// @desc Update bootcamp
// @route Put /api/v1/getBootcamp/:id
// @access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of '${req.params.id}'.`,
        404
      )
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User '${req.params.id} is not authorized to update this bootcamp'.`,
        401
      )
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({ success: true, data: bootcamp });
});

// @desc Delete bootcamp
// @route Delete /api/v1/getBootcamp
// @access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of '${req.params.id}'.`,
        404
      )
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User '${req.params.id} is not authorized to delete this bootcamp'.`,
        401
      )
    );
  }

  bootcamp.remove();

  return res.status(200).json({ success: true, data: {} });
});

// @desc    Get bootcamps within a radius
// @route   Delete /api/v1/bootcamps/radius/:zipcode/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide distance by radius of earth (3,963 mi / 6,378 km)
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc   Upload photo for bootcamp
// @route  Delete /api/v1/bootcamp/:id/photo
// @access Private
exports.uploadPhotoBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of '${req.params.id}'.`,
        404
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the file is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload a image file`, 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    return res.status(200).json({ success: true, data: file.name });
  });
});
