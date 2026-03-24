const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

const pricingFeatureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true } // Can be string or boolean
}, { _id: false });

const pricingPlanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  numericPrice: { type: Number, required: true },
  duration: { type: String, required: true },
  features: [pricingFeatureSchema]
}, { _id: false });

const workplaceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  cityId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  cityName: {
    type: String,
    required: true
  },
  
  cityDisplayName: {
    type: String,
    required: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  hero: {
    backgroundImage: { type: String, required: true },
    badge: { type: String, required: true },
    heading: { type: String, required: true },
    subheading: { type: String, required: true }
  },
  
  localities: {
    type: [String],
    required: true,
    default: ["All"]
  },
  
  properties: [{
    propertyId: { type: String, required: true },
    name: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    cityId: { type: String, required: true },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    amenities: [amenitySchema],
    
    // To store the pill tags at the bottom of the property card
    highlightAmenities: { type: [String], default: [] }, 
    
    badge: { type: String, default: '' },
    capacity: { type: String, default: '' },
    exploreLink: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ["draft", "published", "archived"],
      default: "published"
    },
    
    availableNow: { type: Boolean, default: true },
    
    // 👇 UPDATED: Default is now 0. Admin MUST manually set seats to open the property.
    availableSeats: { type: Number, default: 0, min: 0 }, 
    
    pricingPlans: [pricingPlanSchema],
    standardWorkplaces: [workplaceSchema],
    standardServices: [serviceSchema],
    location: {
      lat: { type: Number, default: 12.9334335 },
      lng: { type: Number, default: 77.6836423 },
      address: { type: String, default: '' },
      embedUrl: { type: String, default: '' }
    },
    contactPhone: { type: String, default: '' }
  }],
  
  emptyState: {
    title: { type: String, default: "Coming Soon" },
    message: { type: String, default: "We are currently setting up premium workspaces in this city. Check back later!" }
  },
  
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  }

}, {
  timestamps: true
});

// Index for faster queries
locationSchema.index({ status: 1, createdAt: -1 });
locationSchema.index({ 'properties.propertyId': 1 });

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;