const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * @desc    Create new order with Payment Screenshot, Selected Color, and Size
 * @route   POST /api/orders
 * @access  Private
 */
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    // Screenshot validation
    if (!req.file) {
      return res.status(400).json({ message: "እባክህ የከፈልክበትን ደረሰኝ (Screenshot) አስገባ" });
    }

    // Parsing JSON strings from form-data
    const parsedItems = typeof orderItems === 'string' ? JSON.parse(orderItems) : orderItems;
    const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;

    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({ message: "ምንም የታዘዘ እቃ የለም" });
    }

    // 1. PRE-CHECK STOCK
    for (const item of parsedItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `ምርቱ አልተገኘም: ${item.name}` });
      }

      if (product.countInStock < item.qty) {
        return res.status(400).json({ 
          message: `ይቅርታ፣ ${item.name} በቂ ክምችት የለም (ያለው: ${product.countInStock})` 
        });
      }
    }

    // 2. Create order with size & color
    const order = new Order({
      user: req.user._id,
      orderItems: parsedItems.map(item => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        product: item.product,
        size: item.size || 'One Size',      // from frontend, fallback
        color: item.color || 'Default'      // from frontend, fallback
      })),
      shippingAddress: parsedAddress,
      totalPrice,
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
      return res.status(404).json({ message: "ትዕዛዙ አልተገኘም" });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: "ይህ ትዕዛዝ ቀድሞውኑ ተከፍሏል" });
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
    res.json({ success: true, message: "ክፍያው ተረጋግጧል! ስቶክ ቀንሷል ✅", updatedOrder });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update order status to In Transit (Shipped)
 * @route   PUT /api/orders/:id/ship
 * @access  Private/Admin
 */
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
    if (!order) return res.status(404).json({ message: "ትዕዛዙ አልተገኘም" });

    order.status = 'Delivered';
    order.isDelivered = true; 
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();
    res.json({ success: true, message: "ትዕዛዙ ደርሷል! ✅", updatedOrder });
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
    else res.status(404).json({ message: "ትዕዛዙ አልተገኘም" });
  } catch (error) {
    res.status(500).json({ message: "የ ID ፎርማት ስህተት ነው" });
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
      return res.status(400).json({ message: "Order cannot be delivered yet" });
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

module.exports = { 
  addOrderItems, 
  getOrderById, 
  updateOrderToPaid, 
  updateOrderToShipped,
  updateOrderToDelivered,
  updateOrderToDeliveredByClient,
  getOrders, 
  getMyOrders 
};