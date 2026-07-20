const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products (with advanced filtering & pagination)
const getProducts = async (req, res) => {
  try {
    const { category, gender, search, newArrival, minPrice, maxPrice, size, color, sort } = req.query;
    const pageSize = 12;
    const page = Number(req.query.page) || 1;

    let query = {};

    if (category && category.toLowerCase() !== 'all') {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }
    if (gender && gender.toLowerCase() !== 'all') {
      query.gender = { $regex: `^${gender}$`, $options: 'i' };
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (newArrival === 'true') {
      query.isNew = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (size) {
      query.sizes = { $in: [size] };
    }

    if (color) {
      query.colors = { $in: [color.toLowerCase()] };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.status(200).json({
      success: true,
      products,
      page,
      pages: Math.ceil(count / pageSize),
      totalProducts: count,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const getProductById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new product with color-specific images
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, gender, countInStock, isNewArrival, sizes, variants } = req.body;

    if (!name || !description || !price || !category || !gender) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    if (!parsedVariants.length) {
      return res.status(400).json({ success: false, message: "At least one color variant is required" });
    }

    // Use req.files array from upload.any()
    const allFiles = req.files || [];

    const finalVariants = parsedVariants.map((variant, idx) => {
      const findPath = (suffix) => {
        // Look for variant-specific image or fallback to simple imageFront/imageBack if only one variant
        const file = allFiles.find(f => 
          f.fieldname === `variantImages[${idx}][${suffix}]` || f.fieldname === suffix
        );
        return file ? file.path : '';
      };

      return {
        color: variant.color.toLowerCase().trim(),
        imageFront: findPath('imageFront'),
        imageBack: findPath('imageBack'),
        imageSide: findPath('imageSide'),
        imageDetail: findPath('imageDetail'),
      };
    });

    const defaultVariant = finalVariants[0];

    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      gender,
      countInStock: Number(countInStock),
      imageFront: defaultVariant.imageFront,
      imageBack: defaultVariant.imageBack,
      imageSide: defaultVariant.imageSide,
      imageDetail: defaultVariant.imageDetail,
      isNew: isNewArrival === 'true' || isNewArrival === true,
      sizes: sizes ? sizes.split(',') : [],
      colors: finalVariants.map(v => v.color),
      variants: finalVariants,
    });

    await product.save();
    res.status(201).json({ success: true, message: "Product created with variants! ✅", product });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, category, gender, countInStock, isNewArrival, sizes, variants } = req.body;

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.gender = gender || product.gender;
    product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
    product.isNew = isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : product.isNew;
    if (sizes) product.sizes = sizes.split(',');

    if (variants || req.files.length > 0) {
      let parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : product.variants;
      const allFiles = req.files || [];
      
      const updatedVariants = parsedVariants.map((variant, idx) => {
        const findPath = (suffix) => {
          const file = allFiles.find(f => f.fieldname === `variantImages[${idx}][${suffix}]` || f.fieldname === suffix);
          return file ? file.path : (variant[suffix] || '');
        };

        return {
          color: variant.color.toLowerCase().trim(),
          imageFront: findPath('imageFront'),
          imageBack: findPath('imageBack'),
          imageSide: findPath('imageSide'),
          imageDetail: findPath('imageDetail'),
        };
      });
      product.variants = updatedVariants;
      product.colors = updatedVariants.map(v => v.color);
      
      if (updatedVariants.length) {
        product.imageFront = updatedVariants[0].imageFront;
        product.imageBack = updatedVariants[0].imageBack;
      }
    }

    const updatedProduct = await product.save();
    res.json({ message: "Product updated! 📝", product: updatedProduct });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.deleteOne();
    res.json({ message: "Product deleted successfully! 🗑️" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review
const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You already reviewed this product" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: "Review added! ⭐", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get new arrival products only (Limited to 8 products for a clean home page slider)
// @route   GET /api/products/new-arrivals
const getNewArrivals = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8; // Allows frontend to customize limits dynamically
    
    // Query directly matches how you save new arrivals: isNew: true
    const products = await Product.find({ isNew: true })
      .sort({ createdAt: -1 }) // Latest first
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get products sorted by lowest price first
// @route   GET /api/products/lowest-cost
const getLowestCostProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;

    // Fetch products where countInStock > 0 (Optional: only show purchasable items)
    const products = await Product.find({})
      .sort({ price: 1 }) // 1 means Ascending Order (Cheapest -> Most Expensive)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get lowest cost products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

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