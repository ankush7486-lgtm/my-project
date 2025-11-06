import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './CreatePost.css';

export default function CreatePost({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/posts', { title, content });
      toast.success('Post created successfully!');
      setTitle('');
      setContent('');
      if (onPostCreated) onPostCreated();
    } catch (err) {
      toast.error('Failed to create post');
      console.error(err);
    }
  };

  return (
    <div className="create-post-container">
      <h2 className="create-post-heading">Create New Post</h2>
      <form onSubmit={handleSubmit} className="create-post-form">
        <input
          type="text"
          className="input-field"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          className="quill-editor"
        />
        <button type="submit" className="submit-button">
          Publish
        </button>
      </form>
    </div>
  );
}
