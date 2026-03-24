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
    // Note: Password is NOT required because users signing up via Google won't have one!
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple users to NOT have a googleId (null) without throwing a unique constraint error
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user' // Everyone defaults to a standard user unless specified
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt dates
});

module.exports = mongoose.model('User', userSchema);