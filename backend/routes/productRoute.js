import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, adminListProducts, updateProduct } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

const uploadFields = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]);

productRouter.post('/add',    adminAuth, uploadFields, addProduct);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/update', adminAuth, uploadFields, updateProduct);  // ← new
productRouter.get('/adminlist', adminAuth, adminListProducts);           // ← new
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);

export default productRouter;