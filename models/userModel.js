const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please tell us your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a passsword'],
    minlength: 8,
    select: false, // do not show to the world when get user
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a passsword'],
    validate: {
      // Only works on CREATE and SAVE
      validator: function (val) {
        return val === this.password;
      },
      message: 'Please type again the password',
    },
  },
});

// Set this option to true to exclude query fields that not in schema from process DB request
userSchema.set('strictQuery', true);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // No longer need this field, no need to save to the DB
  this.passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (candidatePwd, userPwd) {
  return await bcrypt.compare(candidatePwd, userPwd);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
