export const POST_SELECT = "*, categories(name), statuses(status)";

export function mapStatusToId(status) {
  return status === "published" ? 2 : 1;
}

export function mapStatusFromRow(row) {
  if (row.statuses?.status === "publish") {
    return "published";
  }

  return row.statuses?.status ?? "draft";
}

export function formatPost(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    introduction: row.description,
    content: row.content,
    category: row.categories?.name ?? "",
    status: mapStatusFromRow(row),
    image: row.image,
    thumbnail: row.image,
    author: "Thompson P.",
    date: row.date,
    likes: row.likes_count ?? 0,
  };
}

export async function getCategoryIdByName(supabase, categoryName) {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .single();

  if (error) {
    throw new Error(`Category not found: ${categoryName}`);
  }

  return data.id;
}

export function buildPostWritePayload({
  title,
  status,
  introduction,
  content,
  image,
  categoryId,
}) {
  return {
    title,
    description: introduction,
    content,
    category_id: categoryId,
    status_id: mapStatusToId(status),
    image: image ?? null,
    date: new Date().toISOString(),
  };
}
