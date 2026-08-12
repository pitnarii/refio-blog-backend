import { Router } from "express";
import supabase from "../lib/supabase.mjs";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import {
  POST_SELECT,
  buildPostWritePayload,
  formatPost,
  getCategoryIdByName,
} from "../utils/postHelpers.mjs";

const adminPostsRouter = Router();

adminPostsRouter.get("/", protectAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .order("date", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json((data ?? []).map(formatPost));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminPostsRouter.get("/:id", protectAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(formatPost(data));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminPostsRouter.post("/", protectAdmin, async (req, res) => {
  try {
    const { title, category, status, introduction, content, image } = req.body;
    const categoryId = await getCategoryIdByName(supabase, category);

    const { data, error } = await supabase
      .from("posts")
      .insert(
        buildPostWritePayload({
          title,
          status,
          introduction,
          content,
          image,
          categoryId,
        })
      )
      .select(POST_SELECT)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(formatPost(data));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminPostsRouter.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { title, category, status, introduction, content, image } = req.body;
    const categoryId = await getCategoryIdByName(supabase, category);

    const { data, error } = await supabase
      .from("posts")
      .update(
        buildPostWritePayload({
          title,
          status,
          introduction,
          content,
          image,
          categoryId,
        })
      )
      .eq("id", req.params.id)
      .select(POST_SELECT);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data?.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(formatPost(data[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminPostsRouter.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", req.params.id)
      .select("id");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data?.length) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default adminPostsRouter;
