import express from 'express';
import {
    createRazorpayOrder,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus
} from '../controllers/orderController.js';

import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const orderRouter = express.Router();

// Admin routes
orderRouter.post('/list', adminAuth, allOrders);
orderRouter.post('/status', adminAuth, updateStatus);

// User routes
orderRouter.post('/razorpay', authUser, createRazorpayOrder);
orderRouter.post('/', authUser, placeOrderRazorpay);
orderRouter.post('/userorders', authUser, userOrders);

export default orderRouter;
