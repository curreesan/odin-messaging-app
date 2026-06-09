import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import "../styles/Messages.css";

export default function Messages() {
  const { session, user } = useAuth();

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
        { headers: { Authorization: `Bearer ${session.access_token}` } },
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

  if (loading) return <div className="messages-loading">Loading...</div>;
  if (error) return <div className="messages-error">{error}</div>;

  return (
    <div className="messages-page">
      {/* LEFT PANEL */}
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2 className="messages-sidebar-title">Messages</h2>
          <button className="messages-new-button" onClick={openFriendsModal}>
            + New
          </button>
        </div>

        <div className="messages-conversation-list">
          {conversations.length === 0 ? (
            <p className="messages-empty">No conversations yet</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`messages-conversation-item ${
                  selectedConversation?.id === conversation.id
                    ? "messages-conversation-item--active"
                    : ""
                }`}
                onClick={() => loadConversation(conversation)}
              >
                <span className="messages-conversation-name">
                  {conversation.otherUser?.name ||
                    conversation.otherUser?.username}
                </span>
                <span className="messages-conversation-preview">
                  {conversation.lastMessage?.content || "No messages yet"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="messages-chat">
        {!selectedConversation ? (
          <div className="messages-chat-empty">
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            <div className="messages-chat-header">
              <h2 className="messages-chat-name">
                {selectedConversation.otherUser?.name ||
                  selectedConversation.otherUser?.username}
              </h2>
            </div>

            <div className="messages-chat-body">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`messages-bubble-wrapper ${
                    message.sender.id === user?.id
                      ? "messages-bubble-wrapper--self"
                      : ""
                  }`}
                >
                  <span className="messages-bubble-sender">
                    {message.sender.username}
                  </span>
                  <div className="messages-bubble">{message.content}</div>
                </div>
              ))}
            </div>

            <div className="messages-chat-input">
              <input
                className="messages-input"
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button className="messages-send-button" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* FRIENDS MODAL */}
      {showFriendsModal && (
        <div
          className="messages-modal-overlay"
          onClick={() => setShowFriendsModal(false)}
        >
          <div className="messages-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="messages-modal-title">Start a Conversation</h3>

            {friends.length === 0 ? (
              <p className="messages-empty">No friends found</p>
            ) : (
              <div className="messages-modal-list">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="messages-modal-item"
                    onClick={() => startConversation(friend)}
                  >
                    <span className="messages-modal-name">
                      {friend.name || friend.username}
                    </span>
                    <span className="messages-modal-username">
                      @{friend.username}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="messages-modal-close"
              onClick={() => setShowFriendsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
