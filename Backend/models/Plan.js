const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  interval: {
    type: String,
    default: 'month'
  },
  features: [{
    type: String
  }],
  popular: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  },
  description: {
    type: String
  },
  platforms: {
    type: String,
    default: 'Mobile + Desktop'
  },
  allowedTemplates: [{
    type: String
  }],
  allowedModules: [{
    type: String
  }],
  showUdaanLogo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
