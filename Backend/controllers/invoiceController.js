const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Party = require('../models/Party');
const Item = require('../models/Item');
const Payment = require('../models/Payment');

// @desc    Get all invoices for user
// @route   GET /api/invoices
// @access  Private
// @desc    Get all invoices for user
const getInvoices = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const invoices = await Invoice.find({ user: ownerId })
      .populate('party', 'name phone')
      .sort({ createdAt: -1 });

    const SentInvoice = require('../models/SentInvoice');
    const sentInvoices = await SentInvoice.find({ user: req.user.id })
      .populate('party', 'name phone')
      .sort({ createdAt: -1 });

    const combined = [...invoices, ...sentInvoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const { 
      invoiceNumber, party, partyName, type, date, items, 
      subtotal, discountAmount, taxableAmount, gstAmount, 
      roundOff, grandTotal, status, receivedAmount,
      paymentMethod, paymentDetails, transportDetails, shippingDetails,
      sellerDetails, bankDetails,
      billedToAddress, billedToGstin, billedToMobile, billedToState, billingName
    } = req.body;

    if (!invoiceNumber || !type || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or items' });
    }

    const User = require('../models/User');
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    if (owner.billLimit !== -1 && owner.billsGenerated >= owner.billLimit) {
      return res.status(403).json({ message: 'LIMIT_REACHED' });
    }

    if (paymentMethod === 'Online') {
      const { validateUtr, validateUpi } = require('../utils/validation');
      const utrVal = paymentDetails?.utr;
      const upiVal = paymentDetails?.transactionId;

      if (!utrVal || !validateUtr(utrVal)) {
        return res.status(400).json({ message: 'Please enter a valid UTR Number.' });
      }
      if (!upiVal || !validateUpi(upiVal)) {
        return res.status(400).json({ message: 'Please enter a valid UPI ID.' });
      }
    }

    const invoice = await Invoice.create({
      ...req.body,
      user: ownerId,
      invoiceNumber,
      party: party || null,
      partyName: partyName || "Walk-in Customer",
      type,
      date: date || new Date(),
      items,
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      roundOff,
      grandTotal,
      status: status || 'Unpaid',
      receivedAmount: receivedAmount || 0,
      paymentMethod: paymentMethod || 'Cash',
      paymentDetails,
      transportDetails,
      shippingDetails,
      sellerDetails,
      bankDetails,
      billedToAddress,
      billedToGstin: billedToGstin || req.body.gstin || "",
      billedToMobile: billedToMobile || req.body.phone || "",
      billedToState,
      billingName
    });

    // Update Item stock
    for (const item of items) {
      if (item.item && mongoose.Types.ObjectId.isValid(item.item)) {
        const dbItem = await Item.findById(item.item);
        if (dbItem) {
          if (type === 'Sale' || type === 'Delivery Challan' || type === 'Purchase Return' || type === 'Debit Note' || type === 'Export Invoice') {
            dbItem.stockQty -= item.qty;
          } else if (type === 'Purchase' || type === 'Sale Return' || type === 'Credit Note') {
            dbItem.stockQty += item.qty;
          }
          await dbItem.save();
        }
      }
    }

    // Update Party balance
    if (party && mongoose.Types.ObjectId.isValid(party)) {
      const dbParty = await Party.findById(party);
      if (dbParty) {
        let currentMathBalance = dbParty.balanceType === 'To Receive' ? dbParty.balance : -dbParty.balance;
        const netAmount = (grandTotal || 0) - (receivedAmount || 0);
        
        let amountChange = 0;
        if (type === 'Sale') {
          amountChange = netAmount;
        } else if (type === 'Purchase') {
          amountChange = -netAmount;
        } else if (type === 'Sale Return') {
          amountChange = -netAmount;
        } else if (type === 'Purchase Return') {
          amountChange = netAmount;
        }

        const newMathBalance = currentMathBalance + amountChange;
        dbParty.balance = Math.abs(newMathBalance);
        dbParty.balanceType = newMathBalance >= 0 ? 'To Receive' : 'To Pay';
        await dbParty.save();
      }
    }

    owner.billsGenerated = (owner.billsGenerated || 0) + 1;
    await owner.save();

    // Automatically create Payment record if receivedAmount > 0
    if (receivedAmount > 0 && party) {
       await Payment.create({
         user: ownerId,
         party: party,
         partyName: partyName,
         type: (type === 'Sale' || type === 'Purchase Return') ? 'Payment In' : 'Payment Out',
         amount: receivedAmount,
         paymentMode: 'Cash',
         date: date,
         referenceNumber: invoiceNumber,
         description: `Payment for Invoice ${invoiceNumber}`,
         associatedInvoices: [invoice._id]
       });
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new sent invoice (saved in SentInvoice collection)
// @route   POST /api/invoices/send
// @access  Private
const createSentInvoice = async (req, res) => {
  try {
    const SentInvoice = require('../models/SentInvoice');
    const { 
      invoiceNumber, party, partyName, type, date, items, 
      subtotal, discountAmount, taxableAmount, gstAmount, 
      roundOff, grandTotal, status, receivedAmount,
      paymentMethod, paymentDetails, transportDetails, shippingDetails,
      sellerDetails, bankDetails,
      billedToAddress, billedToGstin, billedToMobile, billedToState, billingName
    } = req.body;

    if (!invoiceNumber || !type || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or items' });
    }

    if (paymentMethod === 'Online') {
      const { validateUtr, validateUpi } = require('../utils/validation');
      const utrVal = paymentDetails?.utr;
      const upiVal = paymentDetails?.transactionId;

      if (!utrVal || !validateUtr(utrVal)) {
        return res.status(400).json({ message: 'Please enter a valid UTR Number.' });
      }
      if (!upiVal || !validateUpi(upiVal)) {
        return res.status(400).json({ message: 'Please enter a valid UPI ID.' });
      }
    }

    const sentInvoice = await SentInvoice.create({
      ...req.body,
      user: req.user.id,
      invoiceNumber,
      party,
      partyName,
      type,
      date,
      items,
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      roundOff,
      grandTotal,
      status,
      receivedAmount,
      paymentMethod,
      paymentDetails,
      transportDetails,
      shippingDetails,
      sellerDetails,
      bankDetails,
      billedToAddress,
      billedToGstin: billedToGstin || req.body.gstin || "",
      billedToMobile: billedToMobile || req.body.phone || "",
      billedToState,
      billingName,
      isSent: true
    });

    res.status(201).json(sentInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const invoice = await Invoice.findById(req.params.id).populate('party');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== ownerId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    let invoice = await Invoice.findById(req.params.id);
    let isSentColl = false;
    if (!invoice) {
      const SentInvoice = require('../models/SentInvoice');
      invoice = await SentInvoice.findById(req.params.id);
      isSentColl = true;
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== ownerId && invoice.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await invoice.deleteOne();
    
    // Revert Item stock
    for (const item of invoice.items) {
      if (item.item && mongoose.Types.ObjectId.isValid(item.item)) {
        const dbItem = await Item.findById(item.item);
        if (dbItem) {
          if (invoice.type === 'Sale' || invoice.type === 'Delivery Challan' || invoice.type === 'Purchase Return' || invoice.type === 'Debit Note' || invoice.type === 'Export Invoice') {
            dbItem.stockQty += item.qty;
          } else if (invoice.type === 'Purchase' || invoice.type === 'Sale Return' || invoice.type === 'Credit Note') {
            dbItem.stockQty -= item.qty;
          }
          await dbItem.save();
        }
      }
    }

    // Revert Party balance
    if (invoice.party && mongoose.Types.ObjectId.isValid(invoice.party)) {
      const dbParty = await Party.findById(invoice.party);
      if (dbParty) {
        let currentMathBalance = dbParty.balanceType === 'To Receive' ? dbParty.balance : -dbParty.balance;
        const netAmount = (invoice.grandTotal || 0) - (invoice.receivedAmount || 0);
        
        let amountChange = 0;
        if (invoice.type === 'Sale') {
          amountChange = -netAmount;
        } else if (invoice.type === 'Purchase') {
          amountChange = netAmount;
        } else if (invoice.type === 'Sale Return') {
          amountChange = netAmount;
        } else if (invoice.type === 'Purchase Return') {
          amountChange = -netAmount;
        }

        const newMathBalance = currentMathBalance + amountChange;
        dbParty.balance = Math.abs(newMathBalance);
        dbParty.balanceType = newMathBalance >= 0 ? 'To Receive' : 'To Pay';
        await dbParty.save();
      }
    }

    // Revert Payment if it was auto-created
    if (invoice.receivedAmount > 0 && invoice.party) {
       await Payment.deleteMany({ referenceNumber: invoice.invoiceNumber });
    }

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();
    const { status, receivedAmount, paymentMethod, paymentDetails } = req.body;

    if (!['Paid', 'Unpaid', 'Partial'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Paid, Unpaid, or Partial.' });
    }

    let invoice = await Invoice.findById(req.params.id);
    let isSentColl = false;
    if (!invoice) {
      const SentInvoice = require('../models/SentInvoice');
      invoice = await SentInvoice.findById(req.params.id);
      isSentColl = true;
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.user.toString() !== ownerId && invoice.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const oldReceived = Number(invoice.receivedAmount) || 0;
    const grandTotal = Number(invoice.grandTotal) || 0;

    let newReceived = oldReceived;
    invoice.status = status;
    if (status === 'Paid') {
      newReceived = grandTotal;
      invoice.receivedAmount = grandTotal;
    } else if (status === 'Unpaid') {
      newReceived = 0;
      invoice.receivedAmount = 0;
      invoice.paymentMethod = undefined;
      invoice.paymentDetails = undefined;
    } else if (status === 'Partial' && receivedAmount !== undefined) {
      newReceived = Number(receivedAmount) || 0;
      invoice.receivedAmount = newReceived;
    }

    if (status !== 'Unpaid') {
      if (paymentMethod) invoice.paymentMethod = paymentMethod;
      if (paymentDetails) invoice.paymentDetails = paymentDetails;
    }

    // Update Party balance if party exists
    if (invoice.party && mongoose.Types.ObjectId.isValid(invoice.party)) {
      const dbParty = await Party.findById(invoice.party);
      if (dbParty) {
        const oldNet = grandTotal - oldReceived;
        const newNet = grandTotal - newReceived;
        const diffNet = newNet - oldNet; // positive if unpaid balance increased

        let currentMathBalance = dbParty.balanceType === 'To Receive' ? dbParty.balance : -dbParty.balance;
        let amountChange = 0;
        if (invoice.type === 'Sale') {
          amountChange = diffNet;
        } else if (invoice.type === 'Purchase') {
          amountChange = -diffNet;
        } else if (invoice.type === 'Sale Return') {
          amountChange = -diffNet;
        } else if (invoice.type === 'Purchase Return') {
          amountChange = diffNet;
        }

        const newMathBalance = currentMathBalance + amountChange;
        dbParty.balance = Math.abs(newMathBalance);
        dbParty.balanceType = newMathBalance >= 0 ? 'To Receive' : 'To Pay';
        await dbParty.save();
      }
    }

    await invoice.save();
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public invoice by ID or invoice number (no auth required)
// @route   GET /api/invoices/public/:id
// @access  Public
const getPublicInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id).populate('party');
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id }).populate('party');
    }
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  createSentInvoice,
  getInvoiceById,
  getPublicInvoiceById,
  deleteInvoice,
  updateInvoiceStatus
};
