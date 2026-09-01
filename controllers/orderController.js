const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');

const addOrderItems = catchAsync(async (req, res) => {
  const createdOrder = await orderService.addOrderItems(req.user._id, req.user.email, req.body, req.file);
  res.status(201).json({ success: true, createdOrder });
});

const updateOrderToPaid = catchAsync(async (req, res) => {
  const updatedOrder = await orderService.updateOrderToPaid(req.params.id);
  res.json({ success: true, message: "Payment verified successfully! Stock updated ✅", updatedOrder });
});

const updateOrderToShipped = catchAsync(async (req, res) => {
  const updatedOrder = await orderService.updateOrderToShipped(req.params.id, req.body);
  res.json({ success: true, message: "Order is now In Transit 🚚", updatedOrder });
});

const updateOrderToDelivered = catchAsync(async (req, res) => {
  const updatedOrder = await orderService.updateOrderToDelivered(req.params.id);
  res.json({ success: true, message: "Order marked as delivered! ✅", updatedOrder });
});

const getOrders = catchAsync(async (req, res) => {
  const orders = await orderService.getOrders();
  res.json(orders);
});

const getOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.json(order);
});

const getMyOrders = catchAsync(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user._id);
  res.json({ success: true, orders });
});

const updateOrderToDeliveredByClient = catchAsync(async (req, res) => {
  const updatedOrder = await orderService.updateOrderToDeliveredByClient(req.params.id, req.user._id);
  res.json({ success: true, message: "Order marked as delivered! ✅", updatedOrder });
});

const validateCoupon = catchAsync(async (req, res) => {
  const result = await orderService.validateCoupon(req.body.code, req.user._id, req.user.email);
  return res.status(200).json({ success: true, ...result });
});

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
