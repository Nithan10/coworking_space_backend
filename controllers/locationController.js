const Location = require("../models/location");

// ==========================================
// 🛠️ SMART INVENTORY SYNC HELPER
// Automatically fixes mismatches between seats, badges, and availability
// ==========================================
const syncInventory = (properties) => {
  if (!Array.isArray(properties)) return properties;
  
  return properties.map(p => {
    // Ensure seats is a valid number
    let seats = Number(p.availableSeats);
    if (isNaN(seats)) seats = 0;

    if (seats > 0) {
      // If seats exist, FORCE it to be available
      p.availableNow = true;
      p.availableSeats = seats;
      // If the badge is stuck on Sold Out, reset it to show available seats
      if (!p.capacity || p.capacity.toLowerCase().includes('sold out') || p.capacity === '0 Seats') {
        p.capacity = `${seats} Seats Left`;
      }
    } else {
      // If seats are 0, FORCE it to be locked and sold out
      p.availableNow = false;
      p.availableSeats = 0;
      p.capacity = 'Sold Out';
    }
    return p;
  });
};

// @desc    Create new location
// @route   POST /api/locations
// @access  Private/Admin
const createLocation = async (req, res) => {
  try {
    const { cityId, slug, properties } = req.body;
    
    // Check if location already exists by cityId or slug
    const existingLocation = await Location.findOne({
      $or: [
        { cityId: cityId?.toLowerCase() },
        { slug: slug?.toLowerCase() }
      ]
    });
    
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "Location with this city ID or slug already exists"
      });
    }

    // 🔥 Auto-sync inventory before saving
    if (properties) {
      req.body.properties = syncInventory(properties);
    }

    const location = await Location.create(req.body);
    
    res.status(201).json({
      success: true,
      data: location
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for ${field}. Please use a different value.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private/Admin
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { cityId, slug, properties } = req.body;
    
    // Check if another location already uses this cityId or slug
    if (cityId || slug) {
      const existingLocation = await Location.findOne({
        _id: { $ne: id },
        $or: [
          ...(cityId ? [{ cityId: cityId.toLowerCase() }] : []),
          ...(slug ? [{ slug: slug.toLowerCase() }] : [])
        ]
      });
      
      if (existingLocation) {
        return res.status(400).json({
          success: false,
          message: "Another location with this city ID or slug already exists"
        });
      }
    }
    
    // 🔥 Auto-sync inventory before updating so the DB always matches the seat count!
    if (properties) {
      req.body.properties = syncInventory(properties);
    }
    
    const location = await Location.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value for ${field}. Please use a different value.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
const getAllLocations = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const locations = await Location.find(query).sort({ cityName: 1 });
    
    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single location by ID or slug
// @route   GET /api/locations/:identifier
// @access  Public
const getLocation = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const location = await Location.findOne({
      $or: [
        { cityId: identifier.toLowerCase() },
        { slug: identifier.toLowerCase() },
        { _id: identifier }
      ]
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private/Admin
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findByIdAndDelete(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Location deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get location by cityId (for frontend)
// @route   GET /api/locations/city/:cityId
// @access  Public
const getLocationByCityId = async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const location = await Location.findOne({ 
      cityId: cityId.toLowerCase(),
      status: "published" 
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update location properties
// @route   PATCH /api/locations/:id/properties
// @access  Private/Admin
const updateProperties = async (req, res) => {
  try {
    const { id } = req.params;
    let { properties } = req.body;

    // 🔥 Auto-sync inventory before saving properties
    if (properties) {
        properties = syncInventory(properties);
    }

    const location = await Location.findByIdAndUpdate(
      id,
      { properties },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update location localities
// @route   PATCH /api/locations/:id/localities
// @access  Private/Admin
const updateLocalities = async (req, res) => {
  try {
    const { id } = req.params;
    const { localities } = req.body;

    const location = await Location.findByIdAndUpdate(
      id,
      { localities },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle location status
// @route   PATCH /api/locations/:id/status
// @access  Private/Admin
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const location = await Location.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createLocation,
  getAllLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  getLocationByCityId,
  updateProperties,
  updateLocalities,
  toggleStatus
};