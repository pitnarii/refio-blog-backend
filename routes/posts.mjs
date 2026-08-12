import { Router } from "express";
import supabase from "../lib/supabase.mjs";
import { POST_SELECT, formatPost } from "../utils/postHelpers.mjs";

const postsRouter = Router();

postsRouter.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const category = req.query.category || "";
    const keyword = req.query.keyword || "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("posts")
      .select(POST_SELECT, { count: "exact" })
      .eq("statuses.status", "publish")
      .order("date", { ascending: false });

    if (category) {
      query = query.eq("categories.name", category);
    }

    if (keyword) {
      query = query.ilike("title", `%${keyword}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      posts: (data ?? []).map(formatPost),
      currentPage: page,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      totalPosts: count ?? 0,
      limit,
      nextPage:
        page < Math.max(1, Math.ceil((count ?? 0) / limit)) ? page + 1 : null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

postsRouter.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", req.params.id)
      .eq("statuses.status", "publish")
      .single();

    if (error) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(formatPost(data));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default postsRouter;
