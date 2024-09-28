const mongoose = require('mongoose');

// Credit Listing Schema
const CreditListingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  available: { type: Number, required: true },
  projectType: { type: String, required: true },
  location: { type: String, required: true },
  verificationStandard: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creditListing: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditListing', required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  transactionType: { type: String, enum: ['buy', 'sell'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Cart Schema
const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    creditListing: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditListing', required: true },
    quantity: { type: Number, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const CreditListing = mongoose.model('CreditListing', CreditListingSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Cart = mongoose.model('Cart', CartSchema);

module.exports = { CreditListing, Transaction, Cart };