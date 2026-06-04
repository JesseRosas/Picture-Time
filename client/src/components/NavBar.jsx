import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <nav className="border-b border-stone-800 px-4">
      <div className="max-w-7xl mx-auto h-14 flex items-center justify-between">
        <Link to="/gallery" className="font-display text-lg font-light text-stone-200 tracking-wide hover:text-white transition-colors">
          Home
        </Link>
        <div className="flex items-center gap-6">
          {user?.isAdmin && (
            <Link to="/admin" className="text-xs text-stone-400 hover:text-gold-400 tracking-widest uppercase transition-colors">
              Admin
            </Link>
          )}
          <span className="text-stone-600 text-xs hidden sm:block">{user?.email}</span>
          <button onClick={handleSignOut} className="text-xs text-stone-500 hover:text-stone-300 tracking-widest uppercase transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
