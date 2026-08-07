const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
  },
  partyName: {
    type: String, // Useful if the party is deleted or not formally created
  },
  type: {
    type: String,
    enum: ['Payment In', 'Payment Out'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    default: 'Cash',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  referenceNumber: {
    type: String,
  },
  description: {
    type: String,
  },
  associatedInvoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
