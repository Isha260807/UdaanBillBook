const Payment = require('../models/Payment');
const Party = require('../models/Party');
const Invoice = require('../models/Invoice');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;

    const payments = await Payment.find({ user: ownerId })
      .populate('party', 'name phone')
      .sort({ date: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;

    const { party, partyName, type, amount, paymentMode, date, referenceNumber, description, associatedInvoices } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required' });
    }

    const payment = await Payment.create({
      user: ownerId,
      party: party || undefined,
      partyName,
      type,
      amount,
      paymentMode,
      date,
      referenceNumber,
      description,
      associatedInvoices
    });

    // Update Party balance based on payment
    if (party) {
      const dbParty = await Party.findById(party);
      if (dbParty) {
        let currentMathBalance = dbParty.balanceType === 'To Receive' ? dbParty.balance : -dbParty.balance;
        
        let amountChange = 0;
        if (type === 'Payment In') {
          amountChange = -amount;
        } else if (type === 'Payment Out') {
          amountChange = amount;
        }

        const newMathBalance = currentMathBalance + amountChange;
        dbParty.balance = Math.abs(newMathBalance);
        dbParty.balanceType = newMathBalance >= 0 ? 'To Receive' : 'To Pay';
        await dbParty.save();
      }
    }

    // Update associated invoices status
    if (associatedInvoices && associatedInvoices.length > 0) {
      await Invoice.updateMany(
        { _id: { $in: associatedInvoices } },
        { $set: { status: 'Paid' } }
      );
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  createPayment
};
