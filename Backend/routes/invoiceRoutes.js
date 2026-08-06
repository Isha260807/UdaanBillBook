const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, createSentInvoice, getInvoiceById, getPublicInvoiceById, deleteInvoice, updateInvoiceStatus } = require('../controllers/invoiceController');
const { protect, requirePermission } = require('../middleware/authMiddleware');

router.route('/public/:id').get(getPublicInvoiceById);
router.route('/').get(protect, getInvoices).post(protect, requirePermission('create_invoice'), createInvoice);
router.route('/send').post(protect, createSentInvoice);
router.route('/:id').get(protect, getInvoiceById).delete(protect, requirePermission('create_invoice'), deleteInvoice);
router.route('/:id/status').patch(protect, updateInvoiceStatus);

module.exports = router;
