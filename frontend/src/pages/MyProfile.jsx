import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current session from Supabase
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div>
      <h1>My Profile</h1>

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
      </div>

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
