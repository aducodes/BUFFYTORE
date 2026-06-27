import express from "express";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  uploadComboImage,
  addCombo,
  listCombos,
  listAllCombos,
  updateCombo,
  toggleCombo,
  deleteCombo,
} from "../controllers/comboController.js";

const comboRouter = express.Router();

// Public — frontend fetches active combos
comboRouter.get("/", listCombos);

// Admin — all combos including inactive
comboRouter.get("/all", adminAuth, listAllCombos);

// Admin — upload image (multer handles single file named "image")
comboRouter.post("/upload-image", adminAuth, upload.single("image"), uploadComboImage);

// Admin — CRUD
comboRouter.post("/", adminAuth, addCombo);
comboRouter.put("/:id", adminAuth, updateCombo);
comboRouter.patch("/:id", adminAuth, toggleCombo);
comboRouter.delete("/:id", adminAuth, deleteCombo);

export default comboRouter;