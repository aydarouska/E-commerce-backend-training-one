const mongoose = require("mongoose");

// Minimal, dependency-free slugify (avoids pulling in an extra package just
// for this one string transform).
// تم تعديلها: \p{L} و \p{N} معناها اى حرف او رقم فى اى لغه - عشان الاسم العربى يطلع منه slug صح
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const productSchema = new mongoose.Schema(
  {
    // name / description / category دول القيم بالعربى (اللغه الافتراضيه)
    // و الحقول اللى اخرها En هى الترجمه الانجليزى (اختياريه)
    // لو المستخدم غير اللغه لانجليزى و الترجمه فاضيه بيظهر العربى
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // الاسم بالانجليزى
    nameEn: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    // الوصف بالانجليزى
    descriptionEn: {
      type: String,
      default: "",
    },
    // السعر دايما بيتخزن بالجنيه المصرى
    // و سعر الدولار اللى بيظهر فى الموقع بيتحسب من سعر الصرف اللى فى الاعدادات
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      required: [true, "Main image URL is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    // التصنيف بالانجليزى
    categoryEn: {
      type: String,
      trim: true,
      default: "",
    },
    brand: {
      type: String,
      trim: true,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Count in stock cannot be negative"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index so `search` in GET /products can query name + description
// efficiently instead of falling back to slow regex scans.
productSchema.index({ name: "text", nameEn: "text", description: "text" });

// Regenerate the slug whenever the name changes, and guarantee uniqueness
// by appending -1, -2, ... if the base slug is already taken by another
// product (e.g. two products both named "Classic T-Shirt").
productSchema.pre("save", async function (next) {
  // تم تعديلها: بنعمل slug جديد بس لو الاسم العربى او الانجليزى اتغير
  if (!this.isModified("name") && !this.isModified("nameEn") && this.slug) return next();

  // بنفضل الاسم الانجليزى للرابط - و لو مش موجود بناخد العربى
  const baseSlug = slugify(this.nameEn || this.name) || "product";
  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.models.Product.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
