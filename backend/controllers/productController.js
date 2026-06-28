import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// Add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, subCategory, sizes, bestseller, stock } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now(),
            stock: stock !== undefined && stock !== '' ? Number(stock) : null
        }

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Update existing product (admin)
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, subCategory, sizes, bestseller, stock } = req.body

        if (!id) return res.json({ success: false, message: "Product ID is required" })

        const updateData = {
            name,
            description,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" || bestseller === true,
            sizes: typeof sizes === 'string' ? JSON.parse(sizes) : sizes,
            stock: stock !== undefined && stock !== '' ? Number(stock) : null,
        }

        // Only replace images if new ones were uploaded
        const image1 = req.files?.image1?.[0]
        const image2 = req.files?.image2?.[0]
        const image3 = req.files?.image3?.[0]
        const image4 = req.files?.image4?.[0]
        const newImages = [image1, image2, image3, image4].filter(Boolean)

        if (newImages.length > 0) {
            updateData.image = await Promise.all(
                newImages.map(async (item) => {
                    const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                    return result.secure_url
                })
            )
        }

        await productModel.findByIdAndUpdate(id, updateData)
        res.json({ success: true, message: "Product Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// List products for storefront (excludes out-of-stock)
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({ $or: [{ stock: null }, { stock: { $gt: 0 } }] });
        res.json({ success: true, products })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// List ALL products for admin (includes stock=0)
const adminListProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Remove product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Product Removed" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Single product info
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct, adminListProducts, updateProduct }