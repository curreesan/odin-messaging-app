import supabase from "../lib/supabase.js";
import prisma from "../lib/prisma.js";

const onlineUsers = new Map();

export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("authenticate", async (token) => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          socket.disconnect();
          return;
        }

        onlineUsers.set(user.id, socket.id);
        socket.userId = user.id;
        socket.emit("authenticated", { success: true });
      } catch (err) {
        console.error("Socket auth error:", err);
        socket.disconnect();
      }
    });

    socket.on("send_message", async ({ conversationId, content }) => {
      try {
        if (!socket.userId) {
          return;
        }

        if (!content?.trim()) {
          return;
        }

        // Verify sender belongs to conversation
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversation_id: conversationId,
            user_id: socket.userId,
          },
        });

        if (!participant) {
          return;
        }

        // Save message
        const message = await prisma.message.create({
          data: {
            conversation_id: conversationId,
            sender_id: socket.userId,
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

        // Find other participant
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversation_id: conversationId,
          },
        });

        const recipient = participants.find(
          (participant) => participant.user_id !== socket.userId,
        );

        if (!recipient) {
          return;
        }

        // Check if recipient is online
        const recipientSocketId = onlineUsers.get(recipient.user_id);

        // Deliver instantly
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", message);
        }

        // Acknowledge sender
        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Send Message Socket Error:", error);

        socket.emit("message_error", {
          error: "Failed to send message",
        });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
}

export { onlineUsers };
