// src/components/EditPostModal.jsx
import React, { useState } from 'react';
import API from '../api/api';
import './EditPostModal.css';

export default function EditPostModal({ post, onClose, onPostUpdated }) {
  const [title, setTitle] = useState(post.title);
  const [summary, setSummary] = useState(post.summary);
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary);
      formData.append('content', content);
      if (image) formData.append('image', image);

      const res = await API.put(`/posts/${post._id}`, formData);
      onPostUpdated(res.data); // Update parent post list
      onClose(); // Close modal
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Update failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>Edit Post</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input
            type="text"
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
          <textarea
            placeholder="Post Content"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
