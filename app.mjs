import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.mjs";
import postsRouter from "./routes/posts.mjs";
import adminPostsRouter from "./routes/adminPosts.mjs";
import uploadRouter from "./routes/upload.mjs";
import protectUser from "./middlewares/protectUsers.mjs";
import protectAdmin from "./middlewares/protectAdmin.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://refio-blog.vercel.app",
      process.env.CLIENT_URL,
    ].filter(Boolean),
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/admin/posts", adminPostsRouter);
app.use("/api/upload", uploadRouter);

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
