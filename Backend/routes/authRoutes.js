const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe, updateProfile, loginEmail, getStaff, addStaff, updateStaff, deleteStaff, getPlans, subscribeUser, getPublicSettings, getUserTickets, createUserTicket, getRazorpayKey, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login-email', loginEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/plans', getPlans);
router.post('/subscribe', protect, subscribeUser);
router.get('/settings', getPublicSettings);
router.get('/razorpay-key', getRazorpayKey);
router.post('/razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay', protect, verifyRazorpayPayment);

router.route('/tickets')
  .get(protect, getUserTickets)
  .post(protect, createUserTicket);

// Staff management routes
router.route('/staff')
  .get(protect, restrictTo('admin', 'vendor'), getStaff)
  .post(protect, restrictTo('admin', 'vendor'), addStaff);
  
router.route('/staff/:id')
  .put(protect, restrictTo('admin', 'vendor'), updateStaff)
  .delete(protect, restrictTo('admin', 'vendor'), deleteStaff);

module.exports = router;
