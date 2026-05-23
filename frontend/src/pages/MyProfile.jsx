import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar_url: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUser(session.user);

        const response = await fetch("http://localhost:3000/api/profiles/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const { profile: profileData } = await response.json();

        setProfile(profileData);

        // Populate form
        setFormData({
          name: profileData.name || "",
          bio: profileData.bio || "",
          avatar_url: profileData.avatar_url || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("http://localhost:3000/api/profiles/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }

      setProfile(data.profile);
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <h1>My Profile</h1>

      {!isEditing ? (
        // -------- VIEW MODE --------
        <div>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              width="150"
              style={{ borderRadius: "50%" }}
            />
          ) : (
            <div
              style={{
                width: "150px",
                height: "150px",
                background: "#ddd",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No Image
            </div>
          )}

          <h2>{profile?.name || "No Name"}</h2>

          <p>
            <strong>Username:</strong> @{profile?.username}
          </p>

          <p>
            <strong>Email:</strong> {user?.email}
          </p>

          {profile?.bio ? (
            <div>
              <strong>Bio:</strong>
              <p>{profile.bio}</p>
            </div>
          ) : (
            <p>No bio added yet.</p>
          )}

          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        // -------- EDIT MODE --------
        <form onSubmit={handleUpdate}>
          <div>
            <label>Name:</label>
            <input name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div>
            <label>Bio:</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} />
          </div>

          <div>
            <label>Avatar URL:</label>
            <input
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: "10px" }}>
            <button type="submit">Save</button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/dashboard")}>Go to Dashboard</button>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }}
          style={{ marginLeft: "10px" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
