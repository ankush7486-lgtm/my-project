import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import { useAuth } from '../context/AuthContext';
import './PostList.css';

export default function PostList({ onEdit }) {
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const userPosts = res.data.filter(post => post.author === user?.username);
        setPosts(userPosts);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      }
    };
    fetchPosts();
  }, [user]);

  async function handleDelete(id) {
    try {
      await axios.delete(`/api/posts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(posts.filter(post => post._id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }

  return (
    <div className="post-list-container">
      <h2 className="post-list-heading">Your Posts</h2>
      {posts.length === 0 ? (
        <p className="no-posts-message">No posts yet. Start by creating one!</p>
      ) : (
        <div className="post-list">
          {posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={() => onEdit(post)}
              onDelete={() => handleDelete(post._id)}
              currentUser={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
