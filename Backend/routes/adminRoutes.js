const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAdminDashboardData,
  getAdminAnalyticsData,
  getAdminBusinesses,
  getAdminSubscriptions,
  impersonateUser,
  getAdminRevenueData,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAdminSecurityData,
  getAdminTickets,
  updateAdminTicketStatus,
  getAdminActivityData,
  getPlatformSettingsData,
  updatePlatformSettingsData,
  getAdminProfile,
  updateAdminProfile,
  updateBillingSettings,
  getInvoiceTemplates,
  createInvoiceTemplate,
  updateInvoiceTemplate,
  deleteInvoiceTemplate
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Force protection and role restriction to admin for all routes in this file
router.use(protect);
router.use(restrictTo('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/billing-settings', updateBillingSettings);
router.delete('/users/:id', deleteUser);
router.get('/dashboard', getAdminDashboardData);
router.get('/analytics', getAdminAnalyticsData);
router.get('/businesses', getAdminBusinesses);
router.get('/subscriptions', getAdminSubscriptions);
router.post('/subscriptions', createSubscriptionPlan);
router.put('/subscriptions/:id', updateSubscriptionPlan);
router.delete('/subscriptions/:id', deleteSubscriptionPlan);
router.get('/revenue', getAdminRevenueData);
router.get('/security', getAdminSecurityData);
router.get('/tickets', getAdminTickets);
router.put('/tickets/:id', updateAdminTicketStatus);
router.get('/activity', getAdminActivityData);
router.get('/settings', getPlatformSettingsData);
router.put('/settings', updatePlatformSettingsData);
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Invoice Template CRUD
router.get('/invoice-templates', getInvoiceTemplates);
router.post('/invoice-templates', createInvoiceTemplate);
router.put('/invoice-templates/:id', updateInvoiceTemplate);
router.delete('/invoice-templates/:id', deleteInvoiceTemplate);

module.exports = router;
