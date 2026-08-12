const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true, // One settings document per user
  },
  gstSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  txnSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  generalSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  messageSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  itemSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  partySettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  printSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
  invoiceSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Settings', settingsSchema);
