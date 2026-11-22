const mongoose = require("mongoose");

// شكل المنتج الواحد جوه السله
// ملحوظه: السعر مش بيتخزن هنا - بيتقرا دايما من المنتج نفسه عشان السله ماتعرضش سعر قديم
const cartItemSchema = new mongoose.Schema(
  {
    // رقم المنتج (ref معناها انه بيشاور على collection المنتجات)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // الكميه - اقل حاجه 1
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
  },
  // _id: false عشان mongoose مايعملش id لكل منتج جوه السله (مش محتاجينه)
  { _id: false }
);

// السله: سله واحده لكل مستخدم
const cartSchema = new mongoose.Schema(
  {
    // صاحب السله - unique يعنى مينفعش مستخدم يبقى ليه سلتين
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // المنتجات اللى فى السله
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  // timestamps بيضيف createdAt و updatedAt تلقائى
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
