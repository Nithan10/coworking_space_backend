const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  propertyName: { type: String },
  cityName: { type: String },
  userEmail: { type: String, required: true },
  userName: { type: String },
  extraChairs: { type: Number, default: 0 },
  otherRequirements: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  // NEW FIELDS FOR APPROVAL POPUP
  expectedDeliveryDate: { type: Date },
  adminNote: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);