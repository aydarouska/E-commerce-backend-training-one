const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Product = require("../models/Product");

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { rating: -1 },
};

const MAX_LIMIT = 100;

// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort, featured } = req.query;

  const filter = {};

  // تم تعديلها: البحث بـ regex بدل $text عشان البحث بالعربى يشتغل زى الانجليزى
  // بنعمل escape للرموز الخاصه عشان لو المستخدم كتب رمز زى ( او * مايحصلش خطأ
  // و بندور فى الاسم و الوصف (عربى و انجليزى) و البراند
  if (search && search.trim()) {
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(safe, "i");
    filter.$or = [{ name: re }, { nameEn: re }, { description: re }, { descriptionEn: re }, { brand: re }];
  }

  // تم تعديلها: التصنيف ممكن يتبعت بالعربى او بالانجليزى
  if (category) {
    filter.$and = [{ $or: [{ category }, { categoryEn: category }] }];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  if (featured === "true") {
    filter.isFeatured = true;
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  // تم تعديلها: بنضيف _id فى الاخر عشان الترتيب يبقى ثابت
  // من غير كده المنتجات اللى اتضافت فى نفس اللحظه كانت بتتكرر او تختفى بين الصفحات
  const sortOption = { ...(SORT_OPTIONS[sort] || { createdAt: -1 }), _id: -1 };

  const [products, totalProducts] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      page,
      totalPages: Math.max(Math.ceil(totalProducts / limit), 1),
      totalProducts,
    },
  });
});

// @route   GET /api/products/categories/list
// @access  Public
// تم تعديلها: بترجع التصنيفات بالعربى و الانجليزى و عدد المنتجات فى كل تصنيف
// الشكل: [{ name: "إلكترونيات", nameEn: "Electronics", count: 3 }]
// aggregate + $group بيجمع المنتجات اللى ليها نفس التصنيف
const getCategories = asyncHandler(async (req, res) => {
  const rows = await Product.aggregate([
    { $group: { _id: "$category", nameEn: { $first: "$categoryEn" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const categories = rows.map((r) => ({ name: r._id, nameEn: r.nameEn || "", count: r.count }));

  res.status(200).json({
    success: true,
    data: categories,
  });
});

// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({
    success: true,
    data: { product },
  });
});

// الحقول المسموح بيها عند اضافه منتج (اى حاجه تانيه فى الـ body بتتجاهل)
const CREATABLE_FIELDS = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
  "price",
  "image",
  "images",
  "category",
  "categoryEn",
  "brand",
  "countInStock",
  "isFeatured",
];

// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  // تم تعديلها: بناخد الحقول المسموحه بس (بما فيها الحقول الانجليزى الجديده)
  const data = {};
  CREATABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) data[field] = req.body[field];
  });

  const product = await Product.create(data);

  res.status(201).json({
    success: true,
    data: { product },
  });
});

// @route   PUT /api/products/:id
// @access  Private/Admin
const UPDATABLE_FIELDS = [
  "name",
  "nameEn",
  "description",
  "descriptionEn",
  "categoryEn",
  "price",
  "image",
  "images",
  "category",
  "brand",
  "countInStock",
  "isFeatured",
  "rating",
  "numReviews",
];

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  UPDATABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.status(200).json({
    success: true,
    data: { product },
  });
});

// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    data: { message: "Product deleted successfully" },
  });
});

module.exports = {
  getProducts,
  getCategories,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
