import React, { useState } from 'react';
import { Trash2, Edit, Eye, X, Heart } from 'lucide-react';
import axios from 'axios';
import './PostCard.css';

// Set your base URL globally
axios.defaults.baseURL = 'http://localhost:5000/api/auth';

export default function PostCard({ post, onDelete, onEdit = () => {}, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [likes, setLikes] = useState(post?.likes || []);
  const [liked, setLiked] = useState(post?.likes?.some(like => like._id === currentUser?._id));
  const [comments, setComments] = useState(post?.comments || []);
  const [commentText, setCommentText] = useState('');

  if (!post || !post._id) return null;

  const BASE_URL = 'http://localhost:5000';

  const isValidImage =
    post.image &&
    (post.image.startsWith('http') ||
      post.image.startsWith('data:image') ||
      post.image.startsWith('/uploads'));

  const imageUrl = isValidImage
    ? post.image.startsWith('http') || post.image.startsWith('data:image')
      ? post.image
      : `${BASE_URL}${post.image}`
    : null;

  const toggleLike = async () => {
    try {
      const res = await axios.post(
        `/posts/${post._id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setLikes(res.data.likes);
      setLiked(res.data.likes.some(like => like._id === currentUser?._id));
    } catch (err) {
      alert('Failed to like/unlike');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await axios.post(
        `/posts/${post._id}/comments`,
        { text: commentText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      alert('Failed to comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/posts/${post._id}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${post._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setShowModal(false);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      alert('Failed to delete post');
      console.error(err);
    }
  };

  return (
    <>
      <div className="post-card">
        <div className="post-header">
          <h3 className="post-title">{post.title}</h3>
          <div className="post-actions">
            <button onClick={handleDeletePost} className="action-icon" title="Delete">
              <Trash2 size={18} />
            </button>
            <button className="action-icon" title="Edit" onClick={() => onEdit(post)}>
              <Edit size={18} />
            </button>
          </div>
        </div>

        <p className="post-summary">{post.summary}</p>

        <button onClick={() => setShowModal(true)} className="read-more-button">
          <Eye size={16} style={{ marginRight: '5px' }} />
          Read more
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <h2 className="modal-title">{post.title}</h2>

            {imageUrl ? (
              <img src={imageUrl} alt="Post" className="modal-image" />
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No image available</p>
            )}

            <div className="modal-text">{post.content}</div>

            <div className="like-comment-section">
              <button className={`like-button ${liked ? 'liked' : ''}`} onClick={toggleLike}>
                <Heart size={18} />
                {likes.length} Likes
              </button>

              <form onSubmit={handleCommentSubmit} className="comment-form">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                />
                <button type="submit">Comment</button>
              </form>

              <ul className="comment-list">
                {comments.map((comment) => (
                  <li key={comment._id}>
                    <strong>{comment.user?.username || 'User'}:</strong> {comment.text}
                    {comment.user?._id === currentUser?._id && (
                      <button onClick={() => handleDeleteComment(comment._id)}>❌</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-footer">
              <button className="delete-button" onClick={handleDeletePost}>
                <Trash2 size={18} />
                Delete
              </button>
              <button
                className="read-more-button"
                onClick={() => {
                  onEdit(post);
                  setShowModal(false);
                }}
              >
                <Edit size={18} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
