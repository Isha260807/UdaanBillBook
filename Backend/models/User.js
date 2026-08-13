const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  businessName: {
    type: String,
  },
  businessAddress: {
    type: String,
  },
  businessType: {
    type: String,
  },
  gstin: {
    type: String,
  },
  panNo: {
    type: String,
  },
  aadhaarNo: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  device: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin', 'staff'],
    default: 'vendor'
  },
  status: {
    type: String,
    enum: ['Active', 'Banned', 'Pending', 'Rejected'],
    default: 'Active'
  },
  permissions: [{
    type: String
  }],
  showAds: {
    type: Boolean,
    default: false
  },
  billLimit: {
    type: Number,
    default: -1
  },
  billsGenerated: {
    type: Number,
    default: 0
  },
  fcmTokens: [{
    type: String,
  }],
  fcmTokenMobile: [{
    type: String,
  }],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subscription: {
    plan: {
      type: String,
      default: 'Free'
    },
    status: {
      type: String,
      default: 'active'
    },
    validUntil: {
      type: Date
    }
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  bankAccounts: [{
    name: String,
    balance: Number
  }],
  // FCM tokens array - supports multiple devices (web + mobile)
  fcmTokens: [{ type: String }],
  fcmTokenMobile: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
