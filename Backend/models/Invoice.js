const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  name: {
    type: String,
    required: true,
  },
  hsnSac: String,
  qty: {
    type: Number,
    required: true,
    default: 1,
  },
  rate: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  gst: {
    type: Number,
    default: 0,
  }
});

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
  },
  partyName: {
    type: String,
    required: true, // "Walk-in Customer" if no party ref
  },
  type: {
    type: String,
    enum: ['Sale', 'Purchase', 'Estimate', 'Delivery Challan', 'Credit Note', 'Debit Note'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  roundOff: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Partial'],
    default: 'Unpaid',
  },
  receivedAmount: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Online', 'Bank Transfer'],
    default: 'Cash'
  },
  paymentDetails: {
    transactionId: String,
    utr: String,
    bankName: String,
    accountNumber: String,
    ifsc: String
  },
  transportDetails: {
    transporterName: String,
    transporterId: String, // GSTIN
    vehicleNumber: String,
    vehicleType: {
      type: String,
      enum: ['Regular', 'ODC']
    },
    modeOfTransport: {
      type: String,
      enum: ['Road', 'Rail', 'Air', 'Ship']
    },
    approxDistance: Number,
    lrNumber: String,
    lrDate: Date,
    ewbNumber: String
  },
  shippingDetails: {
    shipToName: String,
    shipToGSTIN: String,
    shipToAddress: String,
    dispatchFromName: String,
    dispatchFromGSTIN: String,
    dispatchFromAddress: String,
    placeOfDispatch: String,
    placeOfDelivery: String
  },
  sellerDetails: {
    companyName: String,
    address: String,
    phone: String,
    email: String,
    gstin: String,
    logoUrl: String,
    signatureText: String,
    signatureUrl: String,
    signatureImgUrl: String
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branchName: String
  },
  billedToAddress: String,
  billedToGstin: String,
  billedToMobile: String,
  billedToState: String,
  billingName: String,
  invoiceTemplate: {
    type: String,
    default: 'GST Boxed'
  },
  themeColor: {
    type: String,
    default: 'slate'
  },
  logoUrl: String,
  signatureText: String,
  signatureUrl: String,
  signatureImgUrl: String,
  terms: String,
  reverseCharge: String,
  challanNo: String,
  vehicleNo: String,
  dateOfSupply: String,
  placeOfSupply: String,
  partyBalance: String,
  description: String,
  acknowledgement: String,
  receivedBy: String,
  deliveredBy: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
