import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) return null;

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/messages">Messages</Link>
        <Link to="/friends">Friends</Link>
        <Link to="/my-profile">My Profile</Link>
      </div>
      <div className="navbar-user">
        <span className="navbar-email">{user?.email}</span>
        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
