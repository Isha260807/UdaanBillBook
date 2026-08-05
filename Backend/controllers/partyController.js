const Party = require('../models/Party');
const Invoice = require('../models/Invoice');
const SentInvoice = require('../models/SentInvoice');

// @desc    Get all parties for the user
// @route   GET /api/parties
// @access  Private
const getParties = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const parties = await Party.find({ user: ownerId }).sort({ createdAt: -1 });

    const dbInvoices = await Invoice.find({ user: ownerId });
    const dbSent = await SentInvoice.find({ user: ownerId });
    const allInvoices = [...dbInvoices, ...dbSent];

    const updatedParties = await Promise.all(parties.map(async (partyDoc) => {
      const p = partyDoc.toObject();
      const pNameLower = (p.name || "").trim().toLowerCase();

      // Find all invoices associated with this party by ID or Name
      const partyInvoices = allInvoices.filter(inv => {
        if (inv.party && inv.party.toString() === p._id.toString()) return true;
        if (inv.partyName && inv.partyName.trim().toLowerCase() === pNameLower) return true;
        return false;
      });

      let mathBalance = 0;

      for (const inv of partyInvoices) {
        const grandTotal = Number(inv.grandTotal) || 0;
        const received = Number(inv.receivedAmount) || 0;
        const net = grandTotal - received;

        if (inv.type === 'Sale') {
          mathBalance += net;
        } else if (inv.type === 'Purchase') {
          mathBalance -= net;
        } else if (inv.type === 'Sale Return') {
          mathBalance -= net;
        } else if (inv.type === 'Purchase Return') {
          mathBalance += net;
        }
      }

      const calculatedBalance = Math.abs(mathBalance);
      const calculatedType = mathBalance >= 0 ? 'To Receive' : 'To Pay';

      // Persist in DB if changed
      if (partyDoc.balance !== calculatedBalance || partyDoc.balanceType !== calculatedType) {
        partyDoc.balance = calculatedBalance;
        partyDoc.balanceType = calculatedType;
        await partyDoc.save();
      }

      return {
        ...p,
        balance: calculatedBalance,
        balanceType: calculatedType
      };
    }));

    res.status(200).json(updatedParties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new party
// @route   POST /api/parties
// @access  Private
const createParty = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const { name, phone, type, gstin, address, balance, balanceType } = req.body;

    if (!name || !phone || !type) {
      return res.status(400).json({ message: 'Name, phone, and type are required' });
    }

    const party = await Party.create({
      user: ownerId,
      name,
      phone,
      type,
      gstin,
      address,
      balance,
      balanceType
    });

    res.status(201).json(party);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a party
// @route   PUT /api/parties/:id
// @access  Private
const updateParty = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    // Make sure the logged in user matches the party user
    if (party.user.toString() !== ownerId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedParty = await Party.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedParty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a party
// @route   DELETE /api/parties/:id
// @access  Private
const deleteParty = async (req, res) => {
  try {
    const ownerId = (req.user.role === 'staff' ? req.user.ownerId : req.user.id).toString();

    const party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({ message: 'Party not found' });
    }

    if (party.user.toString() !== ownerId) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await party.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getParties,
  createParty,
  updateParty,
  deleteParty
};
