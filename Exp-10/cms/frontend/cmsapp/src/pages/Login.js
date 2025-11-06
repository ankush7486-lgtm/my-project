import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' }); // ✅ Correct
  const [showTick, setShowTick] = useState(false); // ✅ Correct
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Correct usage

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(form); // ✅ Delegates to AuthContext login
      toast.success('Login successful!');
      setShowTick(true);

      setTimeout(() => {
        setShowTick(false);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className={`login-card ${showTick ? 'fade-out' : ''}`}>
        <h2>Login</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
          className="input"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="input"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
      </form>

      <AnimatePresence>
        {showTick && (
          <motion.div
            className="tick-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4 }}
          >
            <FaCheckCircle size={80} color="green" />
            <p>Login Successful</p>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="top-center" />
    </div>
  );
}
