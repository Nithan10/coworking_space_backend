const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true }); 

module.exports = mongoose.model('Enquiry', enquirySchema);