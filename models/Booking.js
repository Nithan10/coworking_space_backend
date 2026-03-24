const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, 
  propertyId: { type: String }, 
  propertyName: { type: String },     
  cityName: { type: String },         
  locationAddress: { type: String },  
  plan: { type: String, required: true },
  planFeatures: [{ type: String }],   
  seats: { type: Number, required: true },
  startDate: { type: String, required: true },
  fullName: { type: String, required: true },
  workEmail: { type: String, required: true }, 
  userEmail: { type: String, required: true }, 
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED'], 
    default: 'PENDING' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);