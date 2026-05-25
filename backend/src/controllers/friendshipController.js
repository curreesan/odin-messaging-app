import prisma from "../lib/prisma.js";

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id } = req.body;

    // 1. Basic validation
    if (!receiver_id) {
      return res.status(400).json({ error: "receiver_id is required" });
    }

    if (senderId === receiver_id) {
      return res
        .status(400)
        .json({ error: "You cannot send a request to yourself" });
    }

    // 2. Check if receiver exists
    const receiver = await prisma.profile.findUnique({
      where: { id: receiver_id },
    });

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // 3. Check existing friendship (same direction)
    const existing = await prisma.friendship.findUnique({
      where: {
        sender_id_receiver_id: {
          sender_id: senderId,
          receiver_id: receiver_id,
        },
      },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return res.status(409).json({ error: "Friend request already sent" });
      }

      if (existing.status === "ACCEPTED") {
        return res.status(409).json({ error: "You are already friends" });
      }
    }

    // 4. Check reverse friendship (IMPORTANT)
    const reverse = await prisma.friendship.findUnique({
      where: {
        sender_id_receiver_id: {
          sender_id: receiver_id,
          receiver_id: senderId,
        },
      },
    });

    if (reverse) {
      // If they already sent you a request → accept it
      if (reverse.status === "PENDING") {
        const updated = await prisma.friendship.update({
          where: { id: reverse.id },
          data: { status: "ACCEPTED" },
        });

        return res.status(200).json({
          message: "Friend request accepted (auto-accepted reverse request)",
          friendship: updated,
        });
      }

      if (reverse.status === "ACCEPTED") {
        return res.status(409).json({ error: "You are already friends" });
      }
    }

    // 5. Create new request
    const friendship = await prisma.friendship.create({
      data: {
        sender_id: senderId,
        receiver_id: receiver_id,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "Friend request sent",
      friendship,
    });
  } catch (error) {
    console.error("Send Friend Request Error:", error);

    return res.status(500).json({
      error: "Failed to send friend request",
    });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        receiver_id: userId,
        status: "PENDING",
      },
      include: {
        sender: true, // get sender profile info
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get Incoming Requests Error:", error);
    res.status(500).json({ error: "Failed to fetch incoming requests" });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: {
        sender_id: userId,
        status: "PENDING",
      },
      include: {
        receiver: true, // get receiver profile info
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Get Sent Requests Error:", error);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Only receiver can accept
    if (friendship.receiver_id !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to accept this request" });
    }

    if (friendship.status !== "PENDING") {
      return res.status(400).json({ error: "Request already handled" });
    }

    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    res.json({
      message: "Friend request accepted",
      friendship: updated,
    });
  } catch (error) {
    console.error("Accept Request Error:", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Only receiver can reject
    if (friendship.receiver_id !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to reject this request" });
    }

    await prisma.friendship.delete({
      where: { id },
    });

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Reject Request Error:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    // Transform → return only "the other user"
    const friends = friendships.map((f) => {
      if (f.sender_id === userId) {
        return f.receiver;
      } else {
        return f.sender;
      }
    });

    res.json({ friends });
  } catch (error) {
    console.error("Get Friends Error:", error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
};

const unfriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    // Allow either user
    if (friendship.sender_id !== userId && friendship.receiver_id !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.friendship.delete({
      where: { id },
    });

    res.json({ message: "Unfriended successfully" });
  } catch (error) {
    console.error("Unfriend Error:", error);
    res.status(500).json({ error: "Failed to unfriend" });
  }
};

export {
  sendFriendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  unfriend,
};
