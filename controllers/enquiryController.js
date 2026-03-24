const Enquiry = require('../models/Enquiry');

// @desc    Create a new enquiry (Used by public site)
// @route   POST /api/enquiries
const createEnquiry = async (req, res) => {
  console.log("\n📥 === NEW ENQUIRY REQUEST ===");
  console.log(req.body);

  try {
    const newEnquiry = new Enquiry(req.body);
    await newEnquiry.save();
    
    console.log("✅ Successfully saved to MongoDB!");
    res.status(201).json({ success: true, message: 'Enquiry saved!' });
  } catch (error) {
    console.error('❌ Database Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all enquiries (Used by Admin Panel)
// @route   GET /api/enquiries
const getAllEnquiries = async (req, res) => {
  try {
    // Fetch all enquiries, sort by newest first
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ success: false, message: 'Server error fetching enquiries' });
  }
};

// Health check route function
const testApi = (req, res) => {
  res.status(200).json({ message: "API is alive and working!" });
};

module.exports = { createEnquiry, getAllEnquiries, testApi };