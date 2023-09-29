const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const retObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      retObj[el] = obj[el];
    }
  });
  return retObj;
};

/****************************************************************************************
 * @description: User view info about himself
 */
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create an error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(400, 'This route is not for password update'));
  }

  // 2) Update the document
  const filteredBody = filterObj(req.body, 'name', 'password');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// NOTE: The following requests are used by admin only.
// Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
