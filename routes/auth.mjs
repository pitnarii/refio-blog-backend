import { Router } from "express";
import supabase from "../lib/supabase.mjs";
import { createAuthedClient, supabaseAuth } from "../lib/supabaseAuth.mjs";
import {
  formatUser,
  getProfile,
  resolveRole,
  upsertProfile,
} from "../utils/authHelpers.mjs";

const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabaseAuth.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          username: username.trim(),
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return res.status(409).json({ error: "Email is already taken" });
      }

      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: "Unable to create user" });
    }

    const role = resolveRole(email);

    try {
      await upsertProfile(supabase, data.user.id, {
        name: name.trim(),
        username: username.trim(),
        role,
      });
    } catch (profileError) {
      console.error("Profile creation failed:", profileError.message);
    }

    return res.status(201).json({
      message: "Registration successful",
      user: formatUser(data.user, {
        name: name.trim(),
        username: username.trim(),
        role,
      }),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    let resolvedProfile = await getProfile(supabase, data.user.id);

    if (!resolvedProfile) {
      await upsertProfile(supabase, data.user.id, {
        name: data.user.user_metadata?.name ?? "",
        username: data.user.user_metadata?.username ?? "",
        role: resolveRole(data.user.email),
      });
      resolvedProfile = await getProfile(supabase, data.user.id);
    }

    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: formatUser(data.user, resolvedProfile),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const authedClient = createAuthedClient(token);
    const { data, error } = await authedClient.auth.getUser();

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await getProfile(supabase, data.user.id);

    return res.json({
      user: formatUser(data.user, profile),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Alias for older clients
authRouter.get("/get-user", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }

    const profile = await getProfile(supabase, data.user.id);
    const user = formatUser(data.user, profile);

    return res.status(200).json({
      ...user,
      profilePic: user.profilePicture,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const authedClient = createAuthedClient(token);
    const { data: authData, error: authError } =
      await authedClient.auth.getUser();

    if (authError || !authData.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, username, profilePicture, bio } = req.body;
    const profile = await getProfile(supabase, authData.user.id);

    const nextProfile = {
      name: name?.trim() ?? profile?.name ?? "",
      username: username?.trim() ?? profile?.username ?? "",
      role: profile?.role ?? resolveRole(authData.user.email),
    };

    if (profilePicture !== undefined) {
      nextProfile.profile_pic =
        typeof profilePicture === "string" && profilePicture.trim()
          ? profilePicture.trim()
          : null;
    }

    if (bio !== undefined) {
      nextProfile.bio =
        typeof bio === "string" ? bio.trim().slice(0, 120) : "";
    }

    await upsertProfile(supabase, authData.user.id, nextProfile);

    const updatedProfile = await getProfile(supabase, authData.user.id);

    return res.json({
      user: formatUser(authData.user, updatedProfile),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/verify-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    const authedClient = createAuthedClient(token);
    const { data: authData, error: authError } =
      await authedClient.auth.getUser();

    if (authError || !authData.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    return res.json({ valid: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.put("/password", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    const authedClient = createAuthedClient(token);
    const { data: authData, error: authError } =
      await authedClient.auth.getUser();

    if (authError || !authData.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const { error: updateError } = await authedClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Alias for older clients that used oldPassword/newPassword
authRouter.put("/reset-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const currentPassword = req.body.currentPassword ?? req.body.oldPassword;
    const newPassword = req.body.newPassword;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    const authedClient = createAuthedClient(token);
    const { data: authData, error: authError } =
      await authedClient.auth.getUser();

    if (authError || !authData.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error: verifyError } = await supabaseAuth.auth.signInWithPassword({
      email: authData.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    const { error: updateError } = await authedClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/logout", (_req, res) => {
  return res.json({ message: "Logged out" });
});

export default authRouter;
