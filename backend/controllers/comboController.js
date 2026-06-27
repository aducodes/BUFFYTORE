import { v2 as cloudinary } from "cloudinary";
import comboModel from "../models/comboModel.js";

// Upload a single combo image
const uploadComboImage = async (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) return res.json({ success: false, message: "No image provided" });
    const result = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Add combo
const addCombo = async (req, res) => {
  try {
    const { label, description, discount, badge, image, images, count, slots } = req.body;
    const imagesArr = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const combo = new comboModel({
      label, description,
      discount: Number(discount),
      badge: badge || null,
      image: image || imagesArr[0] || null,
      images: imagesArr,
      count: Number(count),
      slots: typeof slots === "string" ? JSON.parse(slots) : slots,
      active: true,
    });
    await combo.save();
    res.json({ success: true, message: "Combo added", combo });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List active combos (public)
const listCombos = async (req, res) => {
  try {
    const combos = await comboModel.find({ active: { $ne: false } });
    res.json({ success: true, combos });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// List all combos including inactive (admin)
const listAllCombos = async (req, res) => {
  try {
    const combos = await comboModel.find({});
    res.json({ success: true, combos });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update combo
const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, discount, badge, image, images, count, slots } = req.body;
    const imagesArr = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const updated = await comboModel.findByIdAndUpdate(
      id,
      {
        label, description,
        discount: Number(discount),
        badge: badge || null,
        image: image || imagesArr[0] || null,
        images: imagesArr,
        count: Number(count),
        slots: typeof slots === "string" ? JSON.parse(slots) : slots,
      },
      { new: true }
    );
    if (!updated) return res.json({ success: false, message: "Combo not found" });
    res.json({ success: true, message: "Combo updated", combo: updated });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Toggle active
const toggleCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    await comboModel.findByIdAndUpdate(id, { active });
    res.json({ success: true, message: "Combo status updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Delete combo
const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    await comboModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Combo deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { uploadComboImage, addCombo, listCombos, listAllCombos, updateCombo, toggleCombo, deleteCombo };