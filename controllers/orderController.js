const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon'); 

/**
 * @desc    Create new order with Payment Screenshot, Selected Color, Size, and Optional Flat Coupon Discount
 * @route   POST /api/orders
 * @access  Private
 */
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice, couponCode } = req.body;

    // Screenshot validation
    if (!req.file) {
      return res.status(400).json({ message: "Please upload your payment receipt screenshot" });
    }

    // Parsing JSON strings from form-data
    const parsedItems = typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
    const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ message: "No ordered items found" });
    }

    // 1. PRE-CHECK STOCK
    for (const item of parsedItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }

      if (product.countInStock < item.qty) {
        return res.status(400).json({ 
          message: `Sorry, ${item.name} does not have enough stock remaining (Available: ${product.countInStock})` 
        });
      }
    }

    // 2. PROCESS FLAT COUPON DISCOUNT LOGIC
    let finalTotalPrice = Number(totalPrice); 
    let discountAmount = 0;
    let verifiedCouponCode = null;

    if (couponCode && couponCode.trim() !== '') {
      const cleanCode = couponCode.toUpperCase().trim();

      // Enforce unique-use check during absolute generation step to protect order insertion
      const historicalUsageCheck = await Order.findOne({
        user: req.user._id,
        couponApplied: cleanCode
      });

      if (historicalUsageCheck) {
        return res.status(400).json({ message: "You have already used this coupon code on a previous order." });
      }

      const coupon = await Coupon.findOne({
        code: cleanCode,
        associatedEmail: req.user.email.toLowerCase(), // Securely matches coupon with owner
        isUsed: false,
        expiresAt: { $gt: new Date() } // Ensures date hasn't passed expiry window
      });

      if (coupon) {
        // If your coupon data model tracks absolute cash deduction values:
        if (coupon.discountPercentage === 100) {
          discountAmount = finalTotalPrice; // Handles a 100% off full discount
        } else {
          discountAmount = coupon.discountPercentage; // Treats value as flat Birr cash amount (e.g., 2000)
        }

        // Subtract the flat discount amount, making sure total amount doesn't go below 0
        finalTotalPrice = Math.max(0, finalTotalPrice - discountAmount);
        verifiedCouponCode = coupon.code;

        // Burn coupon so it cannot be claimed twice
        coupon.isUsed = true;
        await coupon.save();
      } else {
        return res.status(400).json({ message: "The applied coupon code is invalid or has expired." });
      }
    }

    // 3. Create order with size, color, and updated calculation sums
    const order = new Order({
      user: req.user._id,
      orderItems: parsedItems.map(item => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        product: item.product,
        size: item.size || 'One Size',
        color: item.color || 'Default'
      })),
      shippingAddress: parsedAddress,
      couponApplied: verifiedCouponCode,
      discountAmount: discountAmount,
      totalPrice: finalTotalPrice, // Persists the corrected flat subtraction total
      paymentScreenshot: req.file.path,
      status: 'Pending Verification' 
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, createdOrder });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update order status to Paid and Reduce Stock (Admin Only)
 * @route   PUT /api/orders/:id/pay
 * @access  Private/Admin
 */
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "This order has already been paid" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'Processing';

    // Reduce stock for each item
    const updateStockPromises = order.orderItems.map(async (item) => {
      return await Product.findByIdAndUpdate(
        item.product, 
        { $inc: { countInStock: -item.qty } }
      );
    });

    await Promise.all(updateStockPromises);

    const updatedOrder = await order.save();
    res.json({ success: true, message: "Payment verified successfully! Stock updated ✅", updatedOrder });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update order status to In Transit (Shipped) with delivery window
 * @route   PUT /api/orders/:id/ship
 * @access  Private/Admin
 */
const updateOrderToShipped = async (req, res) => {
  try {
    const { shippedAt, expectedDeliveryStart, expectedDeliveryEnd } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update shipping status
    order.status = 'In Transit';
    order.isShipped = true;
    order.shippedAt = shippedAt ? new Date(shippedAt) : new Date();
    
    // Set delivery window if provided
    if (expectedDeliveryStart) order.expectedDeliveryStart = new Date(expectedDeliveryStart);
    if (expectedDeliveryEnd) order.expectedDeliveryEnd = new Date(expectedDeliveryEnd);

    const updatedOrder = await order.save();
    res.json({ 
      success: true, 
      message: "Order is now In Transit 🚚", 
      updatedOrder 
    });
  } catch (error) {
    console.error("Ship error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update order status to Delivered (Admin)
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = 'Delivered';
    order.isDelivered = true; 
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json({ success: true, message: "Order marked as delivered! ✅", updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) res.json(order);
    else res.status(404).json({ message: "Order not found" });
  } catch (error) {
    res.status(500).json({ message: "Invalid ID format" });
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Client marks order as delivered
 * @route   PUT /api/orders/:id/deliver-client
 * @access  Private (Client)
 */
const updateOrderToDeliveredByClient = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== 'In Transit') {
      return res.status(400).json({ message: "Order cannot be marked as delivered yet" });
    }

    order.status = 'Delivered';
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json({ success: true, message: "Order marked as delivered! ✅", updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Validate a promo coupon code (Enforces strict 1-use per user check historical orders)
 * @route   POST /api/orders/validate-coupon
 * @access  Private
 */
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Please provide a coupon code' });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. CHALLENGE RESOLUTION: Scan past orders to verify if this user has already used it
    const alreadyUsedInPastOrder = await Order.findOne({
      user: req.user._id,
      couponApplied: cleanCode
    });

    if (alreadyUsedInPastOrder) {
      return res.status(400).json({ 
        message: 'You have already used this coupon code on a previous order. Limit 1 use per account.' 
      });
    }

    // 2. Query coupon matching the code format criteria
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // 3. Validate user identity matches the database coupon owner rule
    if (coupon.associatedEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This coupon code is not registered to your account' });
    }

    // 4. Verify usage status flag on Coupon collection
    if (coupon.isUsed) {
      return res.status(400).json({ message: 'This coupon has already been used' });
    }

    // 5. Evaluate current expiration bounds
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Validation successful -> Return data parameters to frontend
    return res.status(200).json({
      success: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage // Pass flat value back to frontend
    });
    
  } catch (error) {
    console.error("Coupon verification failure:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  addOrderItems, 
  getOrderById, 
  updateOrderToPaid, 
  updateOrderToShipped,
  updateOrderToDelivered,
  updateOrderToDeliveredByClient,
  getOrders, 
  getMyOrders,
  validateCoupon
};