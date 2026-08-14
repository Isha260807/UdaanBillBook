const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  gstin: {
    type: String,
  },
  address: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
  balanceType: {
    type: String,
    enum: ['To Receive', 'To Pay'],
    default: 'To Receive',
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
  openingBalanceType: {
    type: String,
    enum: ['To Receive', 'To Pay'],
    default: 'To Receive',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Party', partySchema);
