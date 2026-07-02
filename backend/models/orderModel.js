// models/orderModel.js

import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: 'Order Placed' },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  date: { type: Number, required: true },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  orderType: { type: String, default: 'regular' }, // 'regular' or 'combo'
  comboDetails: { type: Object, default: null },
  courier: { type: String, default: null }, // Kerala delivery courier option (india_post, dtdc, speed, safe)
});

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;