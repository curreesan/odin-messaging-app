import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "../styles/MyProfile.css";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar_url: "",
  });

  const { user, session } = useAuth();

  useEffect(() => {
    if (!session) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/profiles/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!response.ok) throw new Error("Failed to load profile");

        const { profile: profileData } = await response.json();

        setProfile(profileData);
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
  }, [session]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (err) {
      alert("Failed to upload avatar");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/api/profiles/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");

      setProfile(data.profile);
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">Error: {error}</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">My Profile</h1>

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-avatar-wrapper">
              {profile?.avatar_url ? (
                <img
                  className="profile-avatar"
                  src={profile.avatar_url}
                  alt="Profile"
                />
              ) : (
                <div className="profile-avatar-placeholder">No Image</div>
              )}
            </div>

            <div className="profile-info">
              <h2 className="profile-name">{profile?.name || "No Name"}</h2>
              <p className="profile-username">@{profile?.username}</p>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-bio">
                {profile?.bio || "No bio added yet."}
              </p>
            </div>

            <button
              className="profile-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleUpdate}>
            <div className="profile-form-group">
              <label className="profile-label">Name</label>
              <input
                className="profile-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Bio</label>
              <textarea
                className="profile-textarea"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              {uploading && <p className="profile-uploading">Uploading...</p>}
              {formData.avatar_url && (
                <img
                  src={formData.avatar_url}
                  alt="Preview"
                  className="profile-avatar"
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>

            <div className="profile-form-actions">
              <button
                className="profile-button"
                type="submit"
                disabled={uploading}
              >
                Save
              </button>
              <button
                className="profile-button-secondary"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
