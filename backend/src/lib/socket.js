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
        if (!socket.userId) return;
        if (!content?.trim()) return;

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversation_id: conversationId,
            user_id: socket.userId,
          },
        });

        if (!participant) return;

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

        const participants = await prisma.conversationParticipant.findMany({
          where: { conversation_id: conversationId },
        });

        const recipient = participants.find((p) => p.user_id !== socket.userId);

        if (!recipient) return;

        const recipientSocketId = onlineUsers.get(recipient.user_id);

        // Emit to recipient
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receive_message", message);
          io.to(recipientSocketId).emit("conversation_updated", {
            conversationId,
            lastMessage: message,
          });
        }

        // Acknowledge sender
        socket.emit("message_sent", message);
        socket.emit("conversation_updated", {
          conversationId,
          lastMessage: message,
        });
      } catch (error) {
        console.error("Send Message Socket Error:", error);
        socket.emit("message_error", { error: "Failed to send message" });
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
