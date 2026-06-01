import prisma from "../lib/prisma.js";

const findOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        error: "Friend ID is required",
      });
    }

    if (friendId === currentUserId) {
      return res.status(400).json({
        error: "Cannot create conversation with yourself",
      });
    }

    // Verify friend exists
    const friend = await prisma.profile.findUnique({
      where: {
        id: friendId,
      },
    });

    if (!friend) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify friendship exists and is accepted
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            sender_id: currentUserId,
            receiver_id: friendId,
          },
          {
            sender_id: friendId,
            receiver_id: currentUserId,
          },
        ],
      },
    });

    if (!friendship) {
      return res.status(403).json({
        error: "You can only message friends",
      });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                user_id: currentUserId,
              },
            },
          },
          {
            participants: {
              some: {
                user_id: friendId,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (existingConversation) {
      return res.status(200).json({
        conversation: existingConversation,
        existing: true,
      });
    }

    // Create conversation + participants
    const conversation = await prisma.$transaction(async (tx) => {
      const newConversation = await tx.conversation.create({
        data: {},
      });

      await tx.conversationParticipant.createMany({
        data: [
          {
            conversation_id: newConversation.id,
            user_id: currentUserId,
          },
          {
            conversation_id: newConversation.id,
            user_id: friendId,
          },
        ],
      });

      return tx.conversation.findUnique({
        where: {
          id: newConversation.id,
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    return res.status(201).json({
      conversation,
      existing: false,
    });
  } catch (error) {
    console.error("Find/Create Conversation Error:", error);

    return res.status(500).json({
      error: "Failed to create conversation",
      message: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            user_id: currentUserId,
          },
        },
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },

        messages: {
          orderBy: {
            sent_at: "desc",
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const formattedConversations = conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant.user_id !== currentUserId,
      );

      const lastMessage =
        conversation.messages.length > 0 ? conversation.messages[0] : null;

      return {
        id: conversation.id,
        created_at: conversation.created_at,

        otherUser: otherParticipant?.user || null,

        lastMessage,
      };
    });

    formattedConversations.sort((a, b) => {
      const aDate = a.lastMessage
        ? new Date(a.lastMessage.sent_at)
        : new Date(a.created_at);

      const bDate = b.lastMessage
        ? new Date(b.lastMessage.sent_at)
        : new Date(b.created_at);

      return bDate - aDate;
    });

    return res.json({
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);

    return res.status(500).json({
      error: "Failed to fetch conversations",
      message: error.message,
    });
  }
};

export { findOrCreateConversation, getConversations };
