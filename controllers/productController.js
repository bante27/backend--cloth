const productService = require('../services/productService');
const catchAsync = require('../utils/catchAsync');

const getProducts = catchAsync(async (req, res) => {
  const result = await productService.getProducts(req.query);
  res.status(200).json({
    success: true,
    ...result
  });
});

const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.files);
  res.status(201).json({ success: true, message: "Product created with variants! ✅", product });
});

const updateProduct = catchAsync(async (req, res) => {
  const updatedProduct = await productService.updateProduct(req.params.id, req.body, req.files);
  res.json({ message: "Product updated! 📝", product: updatedProduct });
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.json({ message: "Product deleted successfully! 🗑️" });
});

const createProductReview = catchAsync(async (req, res) => {
  const review = await productService.createProductReview(req.params.id, req.user._id, req.user.name, req.body);
  res.status(201).json({ message: "Review added! ⭐", review });
});

const getNewArrivals = catchAsync(async (req, res) => {
  const products = await productService.getNewArrivals(req.query.limit);
  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

const getLowestCostProducts = catchAsync(async (req, res) => {
  const products = await productService.getLowestCostProducts(req.query.limit);
  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductReview,
  getNewArrivals,
  getLowestCostProducts
};
