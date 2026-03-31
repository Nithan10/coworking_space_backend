const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// POST: Create a new request (Used by User Dashboard)
router.post('/create', async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Get requests for a specific user (Used by /requests page)
router.get('/user', async (req, res) => {
  try {
    const requests = await Request.find({ userEmail: req.query.email }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Admin - Get ALL requests (Used by /admin/requests page)
router.get('/all', async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Admin - Update request status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    
    // Build the update object dynamically
    const updateFields = { status };
    if (adminNote !== undefined) updateFields.adminNote = adminNote;

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id, 
      updateFields, 
      { new: true }
    );
    
    res.status(200).json({ success: true, data: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;   