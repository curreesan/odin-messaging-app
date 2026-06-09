import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Friends.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function Friends() {
  const { session } = useAuth();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim() || !session) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/profiles/search?username=${search}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      const data = await res.json();
      setResults(data.profiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (id) => {
    if (!session) return;
    try {
      await fetch(`${API_URL}/api/friendships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ receiver_id: id }),
      });
      alert("Request sent");
    } catch (err) {
      console.error(err);
    }
  };

  const loadRequests = async () => {
    if (!session) return;
    const res = await fetch(`${API_URL}/api/friendships/requests`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setRequests(data.requests || []);
  };

  const loadFriends = async () => {
    if (!session) return;
    const res = await fetch(`${API_URL}/api/friendships`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setFriends(data.friends || []);
  };

  const acceptRequest = async (id) => {
    if (!session) return;
    await fetch(`${API_URL}/api/friendships/${id}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    loadRequests();
    loadFriends();
  };

  const rejectRequest = async (id) => {
    if (!session) return;
    await fetch(`${API_URL}/api/friendships/${id}/reject`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    loadRequests();
  };

  useEffect(() => {
    if (!session) return;
    loadRequests();
    loadFriends();
  }, [session]);

  return (
    <div className="friends-page">
      {/* SEARCH */}
      <section className="friends-section">
        <h2 className="friends-section-title">Find People</h2>
        <form className="friends-search-form" onSubmit={handleSearch}>
          <input
            className="friends-search-input"
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="friends-search-button" type="submit">
            Search
          </button>
        </form>

        {loading && <p className="friends-loading">Searching...</p>}

        {results.length > 0 && (
          <div className="friends-list">
            {results.map((user) => (
              <div className="friends-card" key={user.id}>
                <div className="friends-card-info">
                  <span className="friends-card-name">
                    {user.name || "No name"}
                  </span>
                  <span className="friends-card-username">
                    @{user.username}
                  </span>
                </div>
                <button
                  className="friends-button-primary"
                  onClick={() => sendRequest(user.id)}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INCOMING REQUESTS */}
      <section className="friends-section">
        <h2 className="friends-section-title">
          Incoming Requests
          {requests.length > 0 && (
            <span className="friends-badge">{requests.length}</span>
          )}
        </h2>

        {requests.length === 0 ? (
          <p className="friends-empty">No pending requests</p>
        ) : (
          <div className="friends-list">
            {requests.map((req) => (
              <div className="friends-card" key={req.id}>
                <div className="friends-card-info">
                  <span className="friends-card-name">
                    {req.sender.name || "No name"}
                  </span>
                  <span className="friends-card-username">
                    @{req.sender.username}
                  </span>
                </div>
                <div className="friends-card-actions">
                  <button
                    className="friends-button-primary"
                    onClick={() => acceptRequest(req.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="friends-button-secondary"
                    onClick={() => rejectRequest(req.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FRIENDS LIST */}
      <section className="friends-section">
        <h2 className="friends-section-title">Friends</h2>

        {friends.length === 0 ? (
          <p className="friends-empty">No friends yet</p>
        ) : (
          <div className="friends-list">
            {friends.map((friend) => (
              <div className="friends-card" key={friend.id}>
                <div className="friends-card-info">
                  <span className="friends-card-name">
                    {friend.name || "No name"}
                  </span>
                  <span className="friends-card-username">
                    @{friend.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
