const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { CreditListing, Transaction, Cart } = require('../models/credit');
const User = require('../models/user');
const isAuthenticated = require('../auth/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.redirect('/login');
    }
    res.render('carbonMarket', { user });
  } catch (error) {
    console.error('Error in /marketplace route handler:', error);
    res.status(500).send('Internal Server Error');
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

// Buy Coins
router.post('/api/buyCoins', async (req, res) => {
  try {
      const { amount } = req.body;
      const user = await User.findById(req.session.userId);
      user.coinBalance += parseInt(amount);
      await user.save();
      res.json({ newBalance: user.coinBalance });
  } catch (error) {
      res.status(400).json({ message: 'Failed to buy coins', error: error.message });
  }
});

// Add to cart
router.post('/api/cart/add', isAuthenticated, async (req, res) => {
  try {
    const { creditListingId, quantity } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
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
    console.error('Error adding to cart:', error);
    res.status(400).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

router.post('/api/cart/remove', isAuthenticated, async (req, res) => {
  try {
    const { creditListingId } = req.body;

    if (!creditListingId) {
      return res.status(400).json({ message: 'creditListingId is required' });
    }

    const cart = await Cart.findOne({ user: req.session.userId });
    if (cart) {
      const initialItemCount = cart.items.length;
      cart.items = cart.items.filter(item => item.creditListing.toString() !== creditListingId);
      if (cart.items.length === initialItemCount) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
      await cart.save();
      res.json({ message: 'Item removed from cart', cart });
    } else {
      res.status(404).json({ message: 'Cart not found' });
    }
  } catch (error) {
    console.error('Error in /api/cart/remove:', error);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
});

// Get cart
router.get('/api/cart', isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.session.userId }).populate('items.creditListing');
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

// Checkout

router.post('/api/checkout', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const cart = await Cart.findOne({ user: req.session.userId })
      .populate('items.creditListing');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalCost = 0;
    for (let item of cart.items) {
      totalCost += item.creditListing.price * item.quantity;

      if (item.quantity > item.creditListing.available) {
        return res.status(400).json({ message: `Not enough credits available for ${item.creditListing.name}` });
      }
    }

    if (user.coinBalance < totalCost) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    // Update user balance
    user.coinBalance -= totalCost;
    await user.save();

    // Process each item in the cart
    for (let item of cart.items) {
      const newTransaction = new Transaction({
        user: user._id,
        creditListing: item.creditListing._id,
        quantity: item.quantity,
        totalPrice: item.creditListing.price * item.quantity,
        transactionType: 'buy',
        status: 'completed',
      });
      await newTransaction.save();

      // Update available credits
      item.creditListing.available -= item.quantity;
      await item.creditListing.save();
    }

    // Clear the cart
    await Cart.findByIdAndDelete(cart._id);

    res.json({ message: 'Checkout successful', newBalance: user.coinBalance });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Checkout failed', error: error.message });
  }
});

// Get user balance
router.get('/api/balance', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json({ balance: user.coinBalance });
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch balance', error: error.message });
  }
});

module.exports = router;