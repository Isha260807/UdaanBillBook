const User = require('../models/User');
const Plan = require('../models/Plan');
const Ticket = require('../models/Ticket');
const PlatformSettings = require('../models/PlatformSettings');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'udaanbillbook_secret_key_12345', {
    expiresIn: '30d',
  });
};

const getSubscriptionWithLogo = async (subscription) => {
  if (!subscription) return { plan: 'Free', status: 'active', showUdaanLogo: true };
  const planDetails = await Plan.findOne({ name: subscription.plan, status: 'Active' });
  return {
    plan: subscription.plan || 'Free',
    status: subscription.status || 'active',
    validUntil: subscription.validUntil,
    showUdaanLogo: planDetails ? (planDetails.showUdaanLogo !== undefined ? planDetails.showUdaanLogo : true) : true
  };
};

const otpStore = new Map();

const getDeviceString = (userAgent) => {
  if (!userAgent) return 'Chrome / Windows';
  let os = 'Windows';
  let browser = 'Chrome';
  
  if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return `${browser} / ${os}`;
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { phone, mode } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Please provide a mobile number' });
    }

    const user = await User.findOne({ phone });

    // Allow all modes to send OTP
    // if (mode === 'register' && user) {
    //   return res.status(400).json({ message: 'User already exists. Please login instead.' });
    // }

    // if (mode === 'login' && !user) {
    //   return res.status(404).json({ message: 'User not found. Please register first.' });
    // }

    // Generate simulated dynamic 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, otp);

    console.log(`\n========================================\n[DEMO OTP SERVICE] Generated OTP for +91 ${phone}: ${otp}\n========================================\n`);

    res.status(200).json({ message: `OTP sent to ${phone}`, success: true, otp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, mode, name, business, address, email, role, businessType } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const savedOtp = otpStore.get(phone);

    // Validate OTP (allow 000000 or 123456 as fallbacks for tests/demos)
    if (otp !== "123456" && otp !== "000000" && otp !== savedOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      // Auto-create new user
      user = await User.create({
        phone,
        name: name || "User",
        businessName: business,
        businessAddress: address,
        businessType: businessType,
        email,
        role: (phone === "9876543210" ? "admin" : "vendor")
      });
    } else if (mode === 'register') {
      // If user already exists but trying to register, just update them
      user.name = name || user.name;
      user.businessName = business || user.businessName;
      user.businessAddress = address || user.businessAddress;
      user.businessType = businessType || user.businessType;
      user.email = email || user.email;
      user.role = (phone === "9876543210" ? "admin" : "vendor");
      await user.save();
    }
    
    // Set login stats
    user.lastLogin = new Date();
    user.device = getDeviceString(req.headers['user-agent']);
    await user.save();
    
    if (user.status === 'Banned') {
      return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
    }

    const responseSubscription = await getSubscriptionWithLogo(user.subscription);

    res.json({
      _id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      businessName: user.businessName,
      role: user.role,
      token: generateToken(user._id),
      subscription: responseSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const responseSubscription = await getSubscriptionWithLogo(req.user.subscription);
    const user = {
      _id: req.user.id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      businessName: req.user.businessName,
      businessAddress: req.user.businessAddress,
      gstin: req.user.gstin,
      role: req.user.role,
      showAds: req.user.showAds,
      billLimit: req.user.billLimit,
      billsGenerated: req.user.billsGenerated,
      subscription: responseSubscription
    };
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login with email and password
// @route   POST /api/auth/login-email
// @access  Public
const loginEmail = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Auto-create demo users if email matches preset admin/staff
      if (email.toLowerCase() === 'admin@udaan.com') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const existingPhoneUser = await User.findOne({ phone: '9876543210' });
        if (existingPhoneUser) {
          existingPhoneUser.email = 'admin@udaan.com';
          existingPhoneUser.password = hashedPassword;
          existingPhoneUser.role = 'admin';
          await existingPhoneUser.save();
          user = existingPhoneUser;
        } else {
          user = await User.create({
            name: 'Demo Admin',
            phone: '9876543210',
            email: 'admin@udaan.com',
            password: hashedPassword,
            businessName: 'Demo Business',
            role: 'admin'
          });
        }
      } else if (email.toLowerCase() === 'staff@udaan.com') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const existingPhoneUser = await User.findOne({ phone: '9123456789' });
        if (existingPhoneUser) {
          existingPhoneUser.email = 'staff@udaan.com';
          existingPhoneUser.password = hashedPassword;
          existingPhoneUser.role = 'staff';
          await existingPhoneUser.save();
          user = existingPhoneUser;
        } else {
          user = await User.create({
            name: 'Demo Staff',
            phone: '9123456789',
            email: 'staff@udaan.com',
            password: hashedPassword,
            businessName: 'Demo Business',
            role: 'staff'
          });
        }
      } else {
        return res.status(404).json({ message: 'User not found. Use demo accounts or register first.' });
      }
    }

    if (user.status === 'Banned') {
      return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (user.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
    }

    if (role && user.role !== role) {
      user.role = role;
    }
    
    // Set login stats
    user.lastLogin = new Date();
    user.device = getDeviceString(req.headers['user-agent']);
    await user.save();

    const responseSubscription = await getSubscriptionWithLogo(user.subscription);

    res.status(200).json({
      _id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      businessName: user.businessName,
      role: user.role,
      token: generateToken(user._id),
      subscription: responseSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff for the logged in Admin
// @route   GET /api/auth/staff
// @access  Private
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ ownerId: req.user.id });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new staff
// @route   POST /api/auth/staff
// @access  Private
const addStaff = async (req, res) => {
  try {
    const { name, phone, email, permissions } = req.body;
    
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    const staff = await User.create({
      name,
      phone,
      email,
      role: 'staff',
      password: hashedPassword,
      ownerId: req.user.id,
      permissions: permissions || []
    });

    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff details and permissions
// @route   PUT /api/auth/staff/:id
// @access  Private
const updateStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.ownerId?.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    const updatedStaff = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedStaff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/auth/staff/:id
// @access  Private
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff || staff.ownerId?.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    await staff.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active subscription plans (Public/Vendor)
// @route   GET /api/auth/plans
// @access  Public
const getPlans = async (req, res) => {
  try {
    let dbPlans = await Plan.find({ status: 'Active' });
    if (dbPlans.length === 0) {
      const defaultPlans = [
        { name: "Free", price: 0, interval: "forever", features: ["50 invoices/month", "Basic inventory", "1 user", "Udaan branding"], popular: false, description: "Perfect for exploring the platform", platforms: "Mobile Only", showUdaanLogo: true },
        { name: "Silver", price: 199, interval: "month", features: ["Unlimited invoices", "Advanced inventory", "3 users", "No branding", "Basic GST"], popular: false, description: "Ideal for growing small businesses", platforms: "Mobile + Desktop", showUdaanLogo: false },
        { name: "Gold", price: 299, interval: "month", features: ["Everything in Silver", "Unlimited users", "E-way bills", "Advanced GST", "Staff management"], popular: true, description: "Complete solution for mature businesses", platforms: "Mobile + Desktop", showUdaanLogo: false },
        { name: "Enterprise", price: 499, interval: "month", features: ["Everything in Gold", "Custom themes", "Priority support", "Barcode gen", "API access"], popular: false, description: "Premium subscription for enterprise needs", platforms: "Mobile + Desktop", showUdaanLogo: false }
      ];
      await Plan.insertMany(defaultPlans);
      dbPlans = await Plan.find({ status: 'Active' });
    }
    res.status(200).json(dbPlans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subscribe user to a plan
// @route   POST /api/auth/subscribe
// @access  Private
const subscribeUser = async (req, res) => {
  try {
    const { planName } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const Payment = require('../models/Payment');
    
    // Find the plan price
    const plan = await Plan.findOne({ name: planName, status: 'Active' });
    const price = plan ? plan.price : 0;

    user.subscription = {
      plan: planName,
      status: 'active',
      validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    };
    await user.save();

    // Create a payment record in database if the price > 0
    if (price > 0) {
      await Payment.create({
        user: user._id,
        type: 'Payment In',
        amount: price * 12, // Annual billing
        paymentMode: 'UPI',
        date: new Date(),
        referenceNumber: `TXN-SUB-${Date.now().toString().slice(-6)}`,
        description: `Subscription upgrade to ${planName} Plan`
      });
    }

    const responseSubscription = await getSubscriptionWithLogo(user.subscription);

    res.status(200).json({
      message: `Successfully subscribed to ${planName}`,
      subscription: responseSubscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's support tickets
// @route   GET /api/auth/tickets
// @access  Private
const getUserTickets = async (req, res) => {
  try {
    const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user.id;
    const userIds = [req.user.id];
    if (ownerId) userIds.push(ownerId);

    const tickets = await Ticket.find({ user: { $in: userIds } }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new support ticket
// @route   POST /api/auth/tickets
// @access  Private
const createUserTicket = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    const userId = req.user.id;
    const ticketCount = await Ticket.countDocuments({});
    const ticketId = `TKT-${880 + ticketCount + 1}`;

    const newTicket = await Ticket.create({
      id: ticketId,
      user: userId,
      subject,
      description,
      priority: priority || 'Medium',
      status: 'Open'
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  loginEmail,
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  getPlans,
  getUserTickets,
  createUserTicket
};

// @desc    Get public platform settings (e.g. business categories)
// @route   GET /api/auth/settings
// @access  Public
const getPublicSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    res.status(200).json({
      businessTypes: settings.businessTypes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Razorpay Key ID
// @route   GET /api/auth/razorpay-key
// @access  Public
const getRazorpayKey = async (req, res) => {
  res.status(200).json({ keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key' });
};

// @desc    Create Razorpay Order
// @route   POST /api/auth/razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { planName } = req.body;
    const plan = await Plan.findOne({ name: planName, status: 'Active' });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    const monthlyRate = plan.price;
    const yearlySubtotal = monthlyRate * 12;
    const totalAmount = Math.round(yearlySubtotal * 1.18); // amount in INR
    const amountInPaise = totalAmount * 100;

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret) {
      return res.status(400).json({ message: 'Razorpay keys not configured on server' });
    }

    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName,
      isMock: false
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    const errMsg = error.error?.description || error.message || 'Razorpay order creation failed';
    res.status(500).json({ message: errMsg });
  }
};

// @desc    Verify Razorpay payment and subscribe user
// @route   POST /api/auth/verify-razorpay
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;
    
    // Check if it is a mock transaction
    if (razorpay_order_id && razorpay_order_id.startsWith('order_mock_')) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const Payment = require('../models/Payment');
      const plan = await Plan.findOne({ name: planName, status: 'Active' });
      const price = plan ? plan.price : 0;

      user.subscription = {
        plan: planName,
        status: 'active',
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      };
      await user.save();

      await Payment.create({
        user: user._id,
        type: 'Payment In',
        amount: Math.round(price * 12 * 1.18),
        paymentMode: 'UPI',
        date: new Date(),
        referenceNumber: razorpay_payment_id || `TXN-SUB-${Date.now().toString().slice(-6)}`,
        description: `Mock/Demo Subscription upgrade to ${planName} Plan`
      });

      const responseSubscription = await getSubscriptionWithLogo(user.subscription);

      return res.status(200).json({
        success: true,
        message: `Successfully verified and subscribed to ${planName} (Mock)`,
        subscription: responseSubscription
      });
    }

    const crypto = require('crypto');
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const Payment = require('../models/Payment');
    const plan = await Plan.findOne({ name: planName, status: 'Active' });
    const price = plan ? plan.price : 0;

    user.subscription = {
      plan: planName,
      status: 'active',
      validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    };
    await user.save();

    await Payment.create({
      user: user._id,
      type: 'Payment In',
      amount: Math.round(price * 12 * 1.18),
      paymentMode: 'UPI',
      date: new Date(),
      referenceNumber: razorpay_payment_id || `TXN-SUB-${Date.now().toString().slice(-6)}`,
      description: `Razorpay Subscription upgrade to ${planName} Plan`
    });

    const responseSubscription = await getSubscriptionWithLogo(user.subscription);

    res.status(200).json({
      success: true,
      message: `Successfully verified and subscribed to ${planName}`,
      subscription: responseSubscription
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, businessName, businessAddress, gstin, phone, email } = req.body;
    if (name !== undefined) user.name = name;
    if (businessName !== undefined) user.businessName = businessName;
    if (businessAddress !== undefined) user.businessAddress = businessAddress;
    if (gstin !== undefined) user.gstin = gstin;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;

    await user.save();

    const responseSubscription = await getSubscriptionWithLogo(user.subscription);

    res.json({
      _id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      businessName: user.businessName,
      businessAddress: user.businessAddress,
      gstin: user.gstin,
      role: user.role,
      subscription: responseSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  loginEmail,
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  getPlans,
  subscribeUser,
  getUserTickets,
  createUserTicket,
  getPublicSettings,
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment
};
