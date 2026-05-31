import supabase from "../lib/supabase.js";

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

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
    });
  });
}

export { onlineUsers };
