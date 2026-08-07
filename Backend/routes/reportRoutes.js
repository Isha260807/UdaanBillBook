const express = require('express');
const router = express.Router();
const { getDashboardSummary, getAccountingData } = require('../services/reportService');
const { protect, requirePermission } = require('../middleware/authMiddleware');

const User = require('../models/User');
const Journal = require('../models/Journal');

router.get('/dashboard', protect, requirePermission('view_reports'), async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const summary = await getDashboardSummary(ownerId);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/accounting', protect, requirePermission('view_reports'), async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const data = await getAccountingData(ownerId);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Opening Balance in DB
router.post('/accounting/opening-balance', protect, async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const { amount } = req.body;
    await User.findByIdAndUpdate(ownerId, { openingBalance: Number(amount) || 0 });
    res.status(200).json({ message: 'Opening balance updated in DB', amount: Number(amount) || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Custom Bank Account in DB
router.post('/accounting/banks', protect, async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const { name, balance } = req.body;
    if (!name) return res.status(400).json({ message: 'Bank name is required' });

    const user = await User.findById(ownerId);
    if (user) {
      const exists = user.bankAccounts?.some(b => b.name?.toLowerCase() === name.toLowerCase());
      if (!exists) {
        user.bankAccounts.push({ name, balance: Number(balance) || 0 });
        await user.save();
      }
    }
    res.status(200).json({ message: 'Bank account added in DB', name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Bank Account in DB
router.delete('/accounting/banks/:bankName', protect, async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const { bankName } = req.params;

    const user = await User.findById(ownerId);
    if (user) {
      user.bankAccounts = user.bankAccounts.filter(b => b.name?.toLowerCase() !== bankName.toLowerCase());
      await user.save();
    }
    res.status(200).json({ message: 'Bank account deleted from DB' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Journal Voucher in DB
router.post('/accounting/journals', protect, async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const { debitAcc, creditAcc, amount, narration } = req.body;

    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    const journal = await Journal.create({
      user: ownerId,
      voucher: `JRN-VCH-${Date.now().toString().slice(-4)}`,
      debitAcc: debitAcc || 'Cash',
      creditAcc: creditAcc || 'HDFC',
      amount: Number(amount),
      narration: narration || 'Journal adjustment entry'
    });

    res.status(201).json(journal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
