import prisma from "../lib/prisma.js";

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: currentUserId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: "You are not a participant in this conversation",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        sent_at: "asc",
      },
    });

    return res.json({
      messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);

    return res.status(500).json({
      error: "Failed to fetch messages",
      message: error.message,
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        error: "Message content is required",
      });
    }

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: currentUserId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: "You are not a participant in this conversation",
      });
    }

    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar_url: true,
          },
        },
      },
    });

    return res.status(201).json({
      message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    return res.status(500).json({
      error: "Failed to send message",
      message: error.message,
    });
  }
};

export { getMessages };
