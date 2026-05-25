import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Friends() {
  const [session, setSession] = useState(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
    };

    getSession();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/profiles/search?username=${search}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
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
    try {
      await fetch("http://localhost:3000/api/friendships", {
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
    const res = await fetch("http://localhost:3000/api/friendships/requests", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    setRequests(data.requests || []);
  };

  const loadFriends = async () => {
    const res = await fetch("http://localhost:3000/api/friendships", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    setFriends(data.friends || []);
  };

  const acceptRequest = async (id) => {
    await fetch(`http://localhost:3000/api/friendships/${id}/accept`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    loadRequests();
    loadFriends();
  };

  const rejectRequest = async (id) => {
    await fetch(`http://localhost:3000/api/friendships/${id}/reject`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    loadRequests();
  };

  useEffect(() => {
    if (session) {
      loadRequests();
      loadFriends();
    }
  }, [session]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Friends</h1>

      {/* -------- SEARCH -------- */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Searching...</p>}

      {/* -------- RESULTS -------- */}
      <h2>Search Results</h2>
      {results.map((user) => (
        <div key={user.id}>
          <p>
            {user.name || "No name"} (@{user.username})
          </p>
          <button onClick={() => sendRequest(user.id)}>Add Friend</button>
        </div>
      ))}

      {/* -------- REQUESTS -------- */}
      <h2>Incoming Requests</h2>
      {requests.map((req) => (
        <div key={req.id}>
          <p>
            {req.sender.name || "No name"} (@{req.sender.username})
          </p>
          <button onClick={() => acceptRequest(req.id)}>Accept</button>
          <button onClick={() => rejectRequest(req.id)}>Reject</button>
        </div>
      ))}

      {/* -------- FRIENDS -------- */}
      <h2>Friends</h2>
      {friends.map((friend) => (
        <div key={friend.id}>
          <p>
            {friend.name || "No name"} (@{friend.username})
          </p>
        </div>
      ))}
    </div>
  );
}
