const { z } = require('zod');

const getProductsSchema = z.object({
    query: z.object({
        category: z.string().optional(),
        gender: z.string().optional(),
        search: z.string().optional(),
        newArrival: z.string().optional(),
        minPrice: z.string().optional(),
        maxPrice: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        sort: z.string().optional(),
        page: z.string().optional()
    }).optional()
});

const getProductByIdSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Product ID parameter is required" })
    })
});

const createProductSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        description: z.string({ required_error: "Description is required" }),
        price: z.any({ required_error: "Price is required" }),
        category: z.string({ required_error: "Category is required" }),
        gender: z.string({ required_error: "Gender is required" }),
        countInStock: z.any({ required_error: "Count in stock is required" }),
        isNewArrival: z.any().optional(),
        sizes: z.string().optional(),
        variants: z.any().optional()
    })
});

const updateProductSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.any().optional(),
        category: z.string().optional(),
        gender: z.string().optional(),
        countInStock: z.any().optional(),
        isNewArrival: z.any().optional(),
        sizes: z.string().optional(),
        variants: z.any().optional()
    }),
    params: z.object({
        id: z.string({ required_error: "Product ID parameter is required" })
    })
});

const deleteProductSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Product ID parameter is required" })
    })
});

const createProductReviewSchema = z.object({
    body: z.object({
        rating: z.any({ required_error: "Rating is required" }),
        comment: z.string({ required_error: "Comment is required" })
    }),
    params: z.object({
        id: z.string({ required_error: "Product ID parameter is required" })
    })
});

const getNewArrivalsSchema = z.object({
    query: z.object({
        limit: z.string().optional()
    }).optional()
});

const getLowestCostProductsSchema = z.object({
    query: z.object({
        limit: z.string().optional()
    }).optional()
});

module.exports = {
    getProductsSchema,
    getProductByIdSchema,
    createProductSchema,
    updateProductSchema,
    deleteProductSchema,
    createProductReviewSchema,
    getNewArrivalsSchema,
    getLowestCostProductsSchema
};
