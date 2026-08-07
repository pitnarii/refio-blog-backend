import supabase from "../lib/supabase.mjs";

export const getAllPosts = async (req, res) => {
  const { data, error } = await supabase.from("posts").select("*");
  if (error) {
    return res.status(500).json({ error: "Server could not find a requested posts" });
  }
  return res.status(200).json({
    totalPosts: data.length,
    totalPages: 1,
    currentPage: 1,
    limit: 6,
    posts: data,   
    nextPage: null,
  })
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("posts").select("*").eq("id", id);
  if (error) {
    return res.status(500).json({ error: "Server could not read post because database connection" });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "server could not find a requested post" });
  }
  return res.status(200).json(data);
};

export const createPost = async (req, res) => {
  const { title, image, category_id, description, content, status_id } =
    req.body;
  const { data, error } = await supabase
    .from("posts")
    .insert({ title, image, category_id, description, content, status_id })
    .select();
  if (error) {
    return res.status(500).json({ error: "Server could not create a new post" });
  }
  return res.status(201).json(data);
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, image, category_id, description, content, status_id } =
    req.body;
  const { data, error } = await supabase
    .from("posts")
    .update({ title, image, category_id, description, content, status_id })
    .eq("id", id)
    .select();
  if (error) {
    return res.status(500).json({ error: "Server could not update the post" });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "server could not find a requested post to update" });
  }
  return res.status(200).json(data);
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select();
  if (error) {
    return res.status(500).json({ error: "Server could not delete post because database connection" });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "server could not find a requested post to delete" });
  }
  return res.status(200).json(data);
};