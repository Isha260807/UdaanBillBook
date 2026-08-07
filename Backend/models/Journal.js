const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  voucher: {
    type: String,
    required: true,
  },
  debitAcc: {
    type: String,
    default: 'Cash',
  },
  creditAcc: {
    type: String,
    default: 'HDFC',
  },
  amount: {
    type: Number,
    required: true,
  },
  narration: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Journal', journalSchema);
