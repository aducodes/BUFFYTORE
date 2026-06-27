import mongoose from "mongoose";

const comboSchema = new mongoose.Schema({
  label:       { type: String, required: true },
  description: { type: String, default: "" },
  discount:    { type: Number, required: true },
  badge:       { type: String, default: null },
  image:       { type: String, default: null },   // first image (backwards compat)
  images:      { type: [String], default: [] },   // up to 3 images
  count:       { type: Number, required: true },
  slots: [
    {
      label:    { type: String, required: true },
      category: { type: String, required: true },
    }
  ],
  active: { type: Boolean, default: true },
  date:   { type: Date, default: Date.now },
});

const comboModel = mongoose.models.combo || mongoose.model("combo", comboSchema);
export default comboModel;