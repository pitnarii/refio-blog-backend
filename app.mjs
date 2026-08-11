import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from "./controllers/postsController.mjs";
import validateCreatePost from "./middlewares/post.validation.mjs";
import authRouter from "./routes/auth.mjs";
import protectUser from "./middlewares/protectUsers.mjs";
import protectAdmin from "./middlewares/protectAdmin.mjs";
import postRouter from "./routes/postRoutes.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(
  cors({
    // origin = which Frontend URLs are allowed to call this Backend
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "http://localhost:3000", // Frontend local (other React)
      "https://refio-blog.vercel.app", // Frontend production (no trailing slash)
    ],
  })
);

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.get("/api/posts", getAllPosts);
app.get("/api/posts/:id", getPostById);
app.post("/api/posts", validateCreatePost, createPost);
app.put("/api/posts/:id", validateCreatePost, updatePost);
app.delete("/api/posts/:id", deletePost);

//auth users
app.get("/protected-route", protectUser, (req, res) => {
  res.json({ message: "This is protected content", user: req.user });
});
app.get("/admin-only", protectAdmin, (req, res) => {
  res.json({ message: "This is admin-only content", admin: req.user });
});

const server = app.listen(port, (err) => {
  if (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
  console.log(`Server is running at http://localhost:${port}`);
});

export default app;
