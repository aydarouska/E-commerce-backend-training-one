const express = require("express");
const authRoutes = require("./authRoutes");
<<<<<<< HEAD
=======
const productRoutes = require("./productRoutes");
const userRoutes = require("./userRoutes");
>>>>>>> bd00de6628ac0060497cad5d71481ade6f3b647b

const router = express.Router();

router.use("/auth", authRoutes);
<<<<<<< HEAD

// Future lectures plug in here, e.g.:
// router.use("/products", productRoutes);
=======
router.use("/products", productRoutes);
router.use("/users", userRoutes);

// Future lectures plug in here, e.g.:
>>>>>>> bd00de6628ac0060497cad5d71481ade6f3b647b
// router.use("/cart", cartRoutes);
// router.use("/orders", orderRoutes);

module.exports = router;
