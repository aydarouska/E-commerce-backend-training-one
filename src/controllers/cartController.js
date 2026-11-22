const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// بيجهز شكل السله اللى الفرونت اند مستنيه:
// { items: [{ product, quantity, subtotal }], totalItems, totalPrice }
// و لو فيه منتج اتمسح من المتجر بيشيله من السله تلقائى
const formatCart = async (cart) => {
  // populate بيبدل رقم المنتج ببيانات المنتج كامله
  await cart.populate("items.product");

  // المنتجات اللى لسه موجوده (اللى اتمسح بيرجع null)
  const validItems = cart.items.filter((item) => item.product);
  if (validItems.length !== cart.items.length) {
    cart.items = validItems.map((i) => ({ product: i.product._id, quantity: i.quantity }));
    await cart.save();
    await cart.populate("items.product");
  }

  // كل منتج + الكميه + اجمالى السطر (السعر × الكميه)
  const items = cart.items.map((item) => ({
    product: item.product.toJSON(),
    quantity: item.quantity,
    subtotal: +(item.product.price * item.quantity).toFixed(2),
  }));

  return {
    items,
    // عدد القطع كلها
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    // اجمالى السعر
    totalPrice: +items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2),
  };
};

// بيجيب سله المستخدم - و لو مالوش سله بيعمله واحده فاضيه
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// بيبعت السله للفرونت اند بالشكل الموحد
const sendCart = async (res, cart, status = 200) => {
  res.status(status).json({ success: true, data: { cart: await formatCart(cart) } });
};

// @route   GET /api/cart
// @access  Private
// جلب سله المستخدم الحالى
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await sendCart(res, cart);
});

// @route   POST /api/cart/items   body: { productId, quantity }
// @access  Private
// اضافه منتج للسله (و لو موجود بنزود الكميه)
const addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  // الكميه رقم صحيح و اقل حاجه 1
  const quantity = Math.max(parseInt(req.body.quantity, 10) || 1, 1);

  // نتأكد ان المنتج موجود
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  const cart = await getOrCreateCart(req.user._id);
  // هل المنتج موجود فى السله قبل كده؟
  const existing = cart.items.find((i) => String(i.product) === String(productId));
  const newQty = (existing ? existing.quantity : 0) + quantity;

  // مينفعش الكميه تعدى المخزن
  if (newQty > product.countInStock) {
    throw new AppError(`Only ${product.countInStock} left in stock`, 400);
  }

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  await sendCart(res, cart);
});

// @route   PATCH /api/cart/items/:productId   body: { quantity }
// @access  Private
// تغيير كميه منتج فى السله
const updateItem = asyncHandler(async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!quantity || quantity < 1) throw new AppError("Quantity must be at least 1", 400);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => String(i.product) === req.params.productId);
  if (!item) throw new AppError("Item not in cart", 404);

  // نتأكد ان الكميه الجديده مش اكبر من المخزن
  const product = await Product.findById(req.params.productId);
  if (!product) throw new AppError("Product not found", 404);
  if (quantity > product.countInStock) {
    throw new AppError(`Only ${product.countInStock} left in stock`, 400);
  }

  item.quantity = quantity;
  await cart.save();
  await sendCart(res, cart);
});

// @route   DELETE /api/cart/items/:productId
// @access  Private
// حذف منتج من السله
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
  await cart.save();
  await sendCart(res, cart);
});

// @route   DELETE /api/cart
// @access  Private
// تفضيه السله كلها
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  await sendCart(res, cart);
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
