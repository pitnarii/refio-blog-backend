const ADMIN_EMAIL = "admin@example.com";
const USERS_TABLE = "users";

export function formatUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name ?? authUser.user_metadata?.name ?? "",
    username: profile?.username ?? authUser.user_metadata?.username ?? "",
    profilePicture: profile?.profile_pic ?? null,
    bio: profile?.bio ?? "",
    role: profile?.role ?? "user",
  };
}

export function resolveRole(email, requestedRole) {
  if (email?.toLowerCase() === ADMIN_EMAIL) {
    return "admin";
  }

  return requestedRole ?? "user";
}

export async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("name, username, role, profile_pic, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    // Fallback if bio column does not exist yet
    const fallback = await supabase
      .from(USERS_TABLE)
      .select("name, username, role, profile_pic")
      .eq("id", userId)
      .maybeSingle();

    if (fallback.error) {
      throw fallback.error;
    }

    return fallback.data;
  }

  return data;
}

export async function upsertProfile(supabase, userId, profile) {
  const payload = {
    id: userId,
    name: profile.name,
    username: profile.username,
    role: profile.role,
  };

  if (profile.profile_pic !== undefined) {
    payload.profile_pic = profile.profile_pic;
  }

  if (profile.bio !== undefined) {
    payload.bio = profile.bio;
  }

  const { error } = await supabase.from(USERS_TABLE).upsert(payload);

  if (error) {
    // Retry without bio if column is missing
    if (profile.bio !== undefined && error.message?.toLowerCase().includes("bio")) {
      delete payload.bio;
      const retry = await supabase.from(USERS_TABLE).upsert(payload);
      if (retry.error) {
        throw retry.error;
      }
      return;
    }

    throw error;
  }
}
