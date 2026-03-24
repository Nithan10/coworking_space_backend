const express = require("express");
const router = express.Router();
const {
  createLocation,
  getAllLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  getLocationByCityId,
  updateProperties,
  updateLocalities,
  toggleStatus
} = require("../controllers/locationController");

// Middleware for authentication/authorization (you need to implement these)
// const { protect, admin } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllLocations);
router.get("/city/:cityId", getLocationByCityId);
router.get("/:identifier", getLocation);

// Protected/Admin routes
// router.use(protect, admin); // Uncomment when auth is ready

router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

// Additional update routes
router.patch("/:id/properties", updateProperties);
router.patch("/:id/localities", updateLocalities);
router.patch("/:id/status", toggleStatus);

module.exports = router;