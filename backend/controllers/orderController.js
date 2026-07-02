// controllers/orderController.js

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Razorpay payment and place order
const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      items,
      address,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderType, // 'regular' or 'combo'
      comboDetails, // combo-specific info
      courier, // sent as "courier" from PlaceOrder.jsx
      courierService, // sent as "courierService" from ComboOffers.jsx
    } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.json({ success: false, message: "Payment verification failed" });
    }

    const newOrder = new orderModel({
      userId,
      items,
      address,
      amount,
      paymentMethod: "razorpay",
      payment: true,
      status: "Order Placed",
      date: Date.now(),
      razorpay_order_id,
      razorpay_payment_id,
      orderType: orderType || "regular",
      comboDetails: comboDetails || null,
      // Accept either field name so both PlaceOrder and ComboOffers flows work
      courier: courier || courierService || null,
    });

    await newOrder.save();

    // ── Deduct stock for each item, hide product if stock hits 0 ──
    for (const item of items) {
      if (!item._id) continue;
      const product = await productModel.findById(item._id);
      if (!product || product.stock === null || product.stock === undefined) continue;
      const qty = item.quantity || 1;
      const newStock = product.stock - qty;
      if (newStock <= 0) {
        // Remove product from collection (set stock to 0, mark hidden)
        await productModel.findByIdAndUpdate(item._id, { stock: 0 });
      } else {
        await productModel.findByIdAndUpdate(item._id, { stock: newStock });
      }
    }

    // Clear cart only for regular orders
    if (!orderType || orderType === "regular") {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Fetch all orders
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch all orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// User: Fetch their own orders
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch user orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createRazorpayOrder,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
};