const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true // Ensures no two users can have the same email
  },
  password: {
    type: String,
    required: false // Explicitly false: Google users will not have a password
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // CRITICAL: Allows multiple users to have no googleId (null/undefined) without triggering a unique constraint error
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user' // Everyone defaults to a standard user
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt dates
});

module.exports = mongoose.model('User', userSchema);