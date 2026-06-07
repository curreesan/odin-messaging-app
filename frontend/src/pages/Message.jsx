import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { session } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [friends, setFriends] = useState([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);

  const handleSelectConversation = (conversation) => {
    selectedConversationRef.current = conversation;
    setSelectedConversation(conversation);
  };

  const fetchConversations = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch("http://localhost:3000/api/conversations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to load conversations");
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error(err);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const initialize = async () => {
      try {
        socketRef.current = io("http://localhost:3000");

        socketRef.current.emit("authenticate", session.access_token);

        socketRef.current.on("authenticated", () => {
          console.log("Socket authenticated");
        });

        socketRef.current.on("receive_message", (message) => {
          if (
            selectedConversationRef.current &&
            message.conversation_id === selectedConversationRef.current.id
          ) {
            setMessages((prev) => [...prev, message]);
          }
        });

        socketRef.current.on("message_sent", (message) => {
          setMessages((prev) => [...prev, message]);
        });

        socketRef.current.on("message_error", (error) => {
          console.error(error);
        });

        socketRef.current.on(
          "conversation_updated",
          ({ conversationId, lastMessage }) => {
            setConversations((prev) => {
              const exists = prev.some((c) => c.id === conversationId);

              if (exists) {
                return prev.map((c) =>
                  c.id === conversationId ? { ...c, lastMessage } : c,
                );
              } else {
                // new conversation appeared — refetch
                fetchConversations();
                return prev;
              }
            });
          },
        );

        await fetchConversations();
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [session, fetchConversations]);

  const loadConversation = async (conversation) => {
    if (!session) return;

    try {
      handleSelectConversation(conversation);

      const response = await fetch(
        `http://localhost:3000/api/messages/${conversation.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to load messages");

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    socketRef.current.emit("send_message", {
      conversationId: selectedConversation.id,
      content: messageInput,
    });

    setMessageInput("");
  };

  const openFriendsModal = async () => {
    if (!session) return;

    try {
      const response = await fetch("http://localhost:3000/api/friendships", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to load friends");

      const data = await response.json();
      setFriends(data.friends || []);
      setShowFriendsModal(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const startConversation = async (friend) => {
    if (!session) return;

    try {
      const response = await fetch("http://localhost:3000/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ friendId: friend.id }),
      });

      if (!response.ok) throw new Error("Failed to create conversation");

      const data = await response.json();
      const conversation = data.conversation;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        if (exists) return prev;
        return [
          { ...conversation, otherUser: friend, lastMessage: null },
          ...prev,
        ];
      });

      setShowFriendsModal(false);

      await loadConversation({ ...conversation, otherUser: friend });
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2 style={{ color: "red" }}>{error}</h2>;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: "300px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "10px" }}>
          <button onClick={openFriendsModal}>New Conversation</button>
        </div>

        <h2>Conversations</h2>

        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => loadConversation(conversation)}
            style={{
              padding: "12px",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            <h4>
              {conversation.otherUser?.name || conversation.otherUser?.username}
            </h4>
            <p>{conversation.lastMessage?.content || "No messages yet"}</p>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedConversation ? (
          <div style={{ padding: "20px" }}>
            <h2>Select a conversation</h2>
          </div>
        ) : (
          <>
            <div style={{ padding: "15px", borderBottom: "1px solid #ccc" }}>
              <h2>
                {selectedConversation.otherUser?.name ||
                  selectedConversation.otherUser?.username}
              </h2>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {messages.map((message) => (
                <div key={message.id} style={{ marginBottom: "15px" }}>
                  <strong>{message.sender.username}</strong>
                  <p>{message.content}</p>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                padding: "10px",
                borderTop: "1px solid #ccc",
              }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: "10px" }}
              />
              <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* FRIENDS MODAL */}
      {showFriendsModal && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "1px solid #ccc",
            zIndex: 1000,
            minWidth: "300px",
          }}
        >
          <h3>Select Friend</h3>

          {friends.length === 0 ? (
            <p>No friends found</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => startConversation(friend)}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                }}
              >
                <strong>{friend.name || friend.username}</strong>
                <p>@{friend.username}</p>
              </div>
            ))
          )}

          <button
            onClick={() => setShowFriendsModal(false)}
            style={{ marginTop: "10px" }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
