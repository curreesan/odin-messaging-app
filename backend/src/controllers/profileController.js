import prisma from "../lib/prisma.js";

const createProfile = async (req, res) => {
  try {
    const { username, name, bio, avatar_url } = req.body;
    const userId = req.user.id; // From authMiddleware (Supabase UUID)

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (existingProfile) {
      return res.status(409).json({
        error: "Profile already exists",
      });
    }

    // Check if username is taken
    const usernameTaken = await prisma.profile.findUnique({
      where: { username },
    });

    if (usernameTaken) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    // Create new profile
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        username,
        name: name || null,
        bio: bio || null,
        avatar_url: avatar_url || null,
      },
    });

    res.status(201).json({
      message: "Profile created successfully",
      profile,
    });
  } catch (error) {
    console.error("Create Profile Error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Username is already taken" });
    }

    res.status(500).json({
      error: "Failed to create profile",
      message: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
    });

    console.log("profile:", profile);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, avatar_url } = req.body;

    // ❌ prevent username change
    if (req.body.username) {
      return res.status(400).json({
        error: "Username cannot be changed",
      });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        name: name ?? existingProfile.name,
        bio: bio ?? existingProfile.bio,
        avatar_url: avatar_url ?? existingProfile.avatar_url,
      },
    });

    res.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      error: "Failed to update profile",
    });
  }
};

export { createProfile, getMyProfile, updateProfile };
