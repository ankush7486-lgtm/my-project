import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, UserPlus, LogIn, Pencil, LayoutDashboard, Home as HomeIcon } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ isSidebarOpen, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`navbar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="navbar__logo">MyCMS</div>

        {user && (
          <div className="navbar__user-info">
            <UserPlus size={16} /> {user.name || user.username}
          </div>
        )}

        <div className="navbar__links">
          <NavLink
            to="/home"
            className={({ isActive }) => (isActive ? 'navbar__link active' : 'navbar__link')}
          >
            <HomeIcon size={16} /> Home
          </NavLink>

          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'navbar__link active' : 'navbar__link')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>

          {user && (
            <NavLink
              to="/editor"
              className={({ isActive }) => (isActive ? 'navbar__link active' : 'navbar__link')}
            >
              <Pencil size={16} /> Create Post
            </NavLink>
          )}

          {!user && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'navbar__link active' : 'navbar__link')}
              >
                <LogIn size={16} /> Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'navbar__link active' : 'navbar__link')}
              >
                <UserPlus size={16} /> Register
              </NavLink>
            </>
          )}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="navbar__link logout-btn"
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
