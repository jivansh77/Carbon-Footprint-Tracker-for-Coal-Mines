const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, CreditListing, Transaction, Cart } = require('../models/credit');

router.get('/', (req, res) => {
    res.render('carbonMarket');
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// User registration
router.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

// User login
router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ message: 'Login failed', error: error.message });
  }
});

// Get credit listings
router.get('/api/credits', async (req, res) => {
  try {
    const credits = await CreditListing.find();
    res.json(credits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching credit listings', error: error.message });
  }
});

// Buy coins
router.post('/api/buyCoins', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { coinBalance: amount } },
      { new: true }
    );
    res.json({ newBalance: user.coinBalance });
  } catch (error) {
    res.status(400).json({ message: 'Failed to buy coins', error: error.message });
  }
});

// Add to cart
router.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { creditListingId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.userId });
    
    if (!cart) {
      cart = new Cart({ user: req.user.userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.creditListing.toString() === creditListingId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ creditListing: creditListingId, quantity });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

// Get cart
router.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.creditListing');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

// Checkout
router.post('/api/checkout', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user.userId).session(session);
    const cart = await Cart.findOne({ user: req.user.userId }).populate('items.creditListing').session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    let totalCost = 0;
    for (let item of cart.items) {
      totalCost += item.creditListing.price * item.quantity;
      
      if (item.quantity > item.creditListing.available) {
        throw new Error(`Not enough credits available for ${item.creditListing.name}`);
      }
    }

    if (user.coinBalance < totalCost) {
      throw new Error('Insufficient coins');
    }

    user.coinBalance -= totalCost;
    await user.save();

    for (let item of cart.items) {
      const transaction = new Transaction({
        user: user._id,
        creditListing: item.creditListing._id,
        quantity: item.quantity,
        totalPrice: item.creditListing.price * item.quantity,
        transactionType: 'buy',
        status: 'completed'
      });
      await transaction.save({ session });

      item.creditListing.available -= item.quantity;
      await item.creditListing.save({ session });
    }

    await Cart.findByIdAndDelete(cart._id).session(session);

    await session.commitTransaction();
    res.json({ message: 'Checkout successful', newBalance: user.coinBalance });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: 'Checkout failed', error: error.message });
  } finally {
    session.endSession();
  }
});

// Get user balance
router.get('/api/balance', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ balance: user.coinBalance });
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch balance', error: error.message });
  }
});

module.exports = router;