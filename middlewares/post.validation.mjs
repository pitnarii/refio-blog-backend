const validateCreatePost = (req, res, next) => {
  const { title, image, category_id, description, content, status_id } =
    req.body ?? {};
//check required fields
  if (!title?.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!image?.trim()) {
    return res.status(400).json({ error: "Image is required" });
  }
  if (category_id === undefined || category_id === null || category_id === "") {
    return res.status(400).json({ error: "Category is required" });
  }
  if (!description?.trim()) {
    return res.status(400).json({ error: "Description is required" });
  }
  if (!content?.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  if (status_id === undefined || status_id === null || status_id === "") {
    return res.status(400).json({ error: "Status is required" });
  }

  //check types
  if (typeof title !== "string") {
    return res.status(400).json({ error: "Title must be a string" });
  }
  if (typeof image !== "string") {
    return res.status(400).json({ error: "Image must be a string" });
  }
  if (typeof category_id !== "number") {
    return res.status(400).json({ error: "Category must be a number" });
  }
  if (typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" });
  }
  if (typeof content !== "string") {
    return res.status(400).json({ error: "Content must be a string" });
  }
  if (typeof status_id !== "number") {
    return res.status(400).json({ error: "Status must be a number" });
  }

  next();
};

export default validateCreatePost;
