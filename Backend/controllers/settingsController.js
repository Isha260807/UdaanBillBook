const Settings = require('../models/Settings');
const InvoiceTemplate = require('../models/InvoiceTemplate');

const User = require('../models/User');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const userDoc = await User.findById(ownerId).lean();

    let settings = await Settings.findOne({ user: ownerId }).lean();

    // If settings don't exist for the user, create default ones
    if (!settings) {
      const created = await Settings.create({ user: ownerId });
      settings = created.toObject();
    }

    // Fallback to User document profile fields if settings fields are empty
    if (!settings.businessGstin) {
      settings.businessGstin = settings.gstSettings?.gstin || userDoc?.gstin || '';
    }
    if (!settings.businessName) {
      settings.businessName = userDoc?.businessName || userDoc?.name || '';
    }
    if (!settings.businessAddress) {
      settings.businessAddress = userDoc?.businessAddress || '';
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const body = req.body || {};

    let settings = await Settings.findOne({ user: ownerId });

    if (!settings) {
      settings = new Settings({ user: ownerId });
    }

    const sections = [
      'gstSettings',
      'txnSettings',
      'generalSettings',
      'messageSettings',
      'itemSettings',
      'partySettings',
      'printSettings',
      'invoiceSettings'
    ];

    sections.forEach((sec) => {
      if (body[sec]) {
        settings[sec] = {
          ...(settings[sec] || {}),
          ...body[sec]
        };
        settings.markModified(sec);
      }
    });

    // Also support root-level direct field updates
    Object.keys(body).forEach((key) => {
      if (!sections.includes(key) && key !== 'user' && key !== '_id') {
        settings[key] = body[key];
      }
    });

    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload company logo
// @route   POST /api/settings/upload-logo
// @access  Private
const uploadLogo = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    let settings = await Settings.findOne({ user: ownerId });
    if (!settings) {
      settings = new Settings({ user: ownerId });
    }
    
    settings.printSettings.companyLogoUrl = req.file.path;
    settings.printSettings.printCompanyLogo = true;
    
    await settings.save();
    res.status(200).json({ url: req.file.path, message: 'Logo uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload signature
// @route   POST /api/settings/upload-signature
// @access  Private
const uploadSignature = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    let settings = await Settings.findOne({ user: ownerId });
    if (!settings) {
      settings = new Settings({ user: ownerId });
    }
    
    settings.printSettings.signatureUrl = req.file.path;
    
    await settings.save();
    res.status(200).json({ url: req.file.path, message: 'Signature uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active invoice templates (vendor-facing)
// @route   GET /api/settings/invoice-templates
// @access  Private
const getActiveInvoiceTemplates = async (req, res) => {
  try {
    const templates = await InvoiceTemplate.find({ isActive: true }).sort({ sortOrder: 1 });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadSignature,
  getActiveInvoiceTemplates
};
