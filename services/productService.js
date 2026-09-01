const Product = require('../models/Product');
const AppError = require('../utils/appError');

class ProductService {
    async getProducts(queryParams) {
        const { category, gender, search, newArrival, minPrice, maxPrice, size, color, sort } = queryParams;
        const pageSize = 12;
        const page = Number(queryParams.page) || 1;

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

        return {
            products,
            page,
            pages: Math.ceil(count / pageSize),
            totalProducts: count,
        };
    }

    async getProductById(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new AppError('Invalid Product ID format', 400);
        }

        const product = await Product.findById(id);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        return product;
    }

    async createProduct(body, files) {
        const { name, description, price, category, gender, countInStock, isNewArrival, sizes, variants } = body;

        if (!name || !description || !price || !category || !gender) {
            throw new AppError("Missing required fields", 400);
        }

        let parsedVariants = [];
        if (variants) {
            parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        }

        if (!parsedVariants.length) {
            throw new AppError("At least one color variant is required", 400);
        }

        const allFiles = files || [];

        const finalVariants = parsedVariants.map((variant, idx) => {
            const findPath = (suffix) => {
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
        return product;
    }

    async updateProduct(id, body, files) {
        const product = await Product.findById(id);
        if (!product) throw new AppError("Product not found", 404);

        const { name, description, price, category, gender, countInStock, isNewArrival, sizes, variants } = body;

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.gender = gender || product.gender;
        product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
        product.isNew = isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : product.isNew;
        if (sizes) product.sizes = sizes.split(',');

        if (variants || (files && files.length > 0)) {
            let parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : product.variants;
            const allFiles = files || [];

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
        return updatedProduct;
    }

    async deleteProduct(id) {
        const product = await Product.findById(id);
        if (!product) throw new AppError("Product not found", 404);
        await product.deleteOne();
        return true;
    }

    async createProductReview(productId, userId, userName, body) {
        const { rating, comment } = body;
        const product = await Product.findById(productId);
        if (!product) throw new AppError("Product not found", 404);

        const alreadyReviewed = product.reviews.find(r => r.user.toString() === userId.toString());
        if (alreadyReviewed) {
            throw new AppError("You already reviewed this product", 400);
        }

        const review = {
            name: userName,
            rating: Number(rating),
            comment,
            user: userId,
        };
        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;
        await product.save();
        return review;
    }

    async getNewArrivals(queryLimit) {
        const limit = Number(queryLimit) || 8;
        const products = await Product.find({ isNew: true })
            .sort({ createdAt: -1 })
            .limit(limit);
        return products;
    }

    async getLowestCostProducts(queryLimit) {
        const limit = Number(queryLimit) || 8;
        const products = await Product.find({})
            .sort({ price: 1 })
            .limit(limit);
        return products;
    }
}

module.exports = new ProductService();
