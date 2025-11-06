import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import PostEditor from './components/PostEditor';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Default route "/" shows Dashboard */}
        <Route
          path="/"
          element={
            <PageTransition><Dashboard /></PageTransition>
          }
        />

        {/* Separate /home route to show Home component */}
        <Route
          path="/home"
          element={
            <PageTransition><Home /></PageTransition>
          }
        />

        <Route
          path="/login"
          element={
            <PageTransition><Login /></PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition><Register /></PageTransition>
          }
        />
        <Route
          path="/editor"
          element={
            <PrivateRoute>
              <PageTransition><PostEditor /></PageTransition>
            </PrivateRoute>
          }
        />
        
        {/* Catch-all route to redirect unknown paths to "/" or 404 page if you want */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <AuthProvider>
      <Router>
        <Navbar isSidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div
          className={`overlay ${sidebarOpen ? '' : 'hidden'}`}
          onClick={closeSidebar}
        />
        <main className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
          <AnimatedRoutes />
        </main>
      </Router>
    </AuthProvider>
  );
}
