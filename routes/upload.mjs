import { Router } from "express";
import multer from "multer";
import supabase from "../lib/supabase.mjs";
import protectUser from "../middlewares/protectUsers.mjs";

const uploadRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const BUCKET = process.env.STORAGE_BUCKET || "post-images";

uploadRouter.post("/", protectUser, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, "-")}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    return res.json({ url: data.publicUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default uploadRouter;
