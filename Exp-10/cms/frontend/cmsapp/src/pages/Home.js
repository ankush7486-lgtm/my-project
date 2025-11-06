import React, { useEffect, useState, useCallback } from 'react';
import { Heart, UserCircle2, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import toast from 'react-hot-toast';
import parse from 'html-react-parser';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [commentsVisible, setCommentsVisible] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentDropdownVisible, setCommentDropdownVisible] = useState({});

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [previousSearches, setPreviousSearches] = useState(() => {
    const saved = localStorage.getItem('previousSearches');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/posts');
      const postsData = Array.isArray(res.data) ? res.data : (res.data.posts || []);
      setPosts(postsData);

      const likesState = {};
      const commentsState = {};
      postsData.forEach(post => {
        likesState[post._id] = {
          liked: post.likedByCurrentUser || false,
          count: post.likesCount || 0,
        };
        commentsState[post._id] = post.comments || [];
      });
      setLikes(likesState);
      setComments(commentsState);
    } catch (err) {
      setError('Failed to load posts.');
      toast.error('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const redirectToLogin = () => {
    toast.error('Please login to continue');
    navigate('/login');
  };

  const handleLike = async (postId) => {
    if (!user) return redirectToLogin();

    const currentLike = likes[postId];
    if (!currentLike) return;

    const newLikeState = {
      liked: !currentLike.liked,
      count: currentLike.liked ? currentLike.count - 1 : currentLike.count + 1,
    };
    setLikes(prev => ({ ...prev, [postId]: newLikeState }));

    try {
      const res = await API.post(`/posts/${postId}/like`);
      if (res.data && typeof res.data.likesCount === 'number') {
        setLikes(prev => ({
          ...prev,
          [postId]: {
            liked: res.data.likedByCurrentUser,
            count: res.data.likesCount,
          }
        }));
      }
    } catch (err) {
      toast.error('Error updating like');
      setLikes(prev => ({ ...prev, [postId]: currentLike }));
    }
  };

  const handleComment = async (postId) => {
    if (!user) return redirectToLogin();

    const text = newComments[postId];
    if (!text?.trim()) return;

    try {
      const res = await API.post(`/posts/${postId}/comments`, { text });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setNewComments(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      toast.error('Error posting comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`);
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c._id !== commentId)
      }));
      setCommentDropdownVisible(prev => ({
        ...prev,
        [commentId]: false
      }));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Post link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy post link.'));
  };

  const toggleComments = (postId) => {
    setCommentsVisible(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();

  // Search handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    if (!searchTerm.trim()) return;

    setPreviousSearches(prev => {
      const updated = [searchTerm, ...prev.filter(term => term !== searchTerm)];
      const limited = updated.slice(0, 5); // Limit to last 5 searches
      localStorage.setItem('previousSearches', JSON.stringify(limited));
      return limited;
    });
    setShowSearchDropdown(false);
  };

  const filteredPosts = posts.filter(post => {
    const lowerSearch = searchTerm.toLowerCase();
    const titleMatch = post.title.toLowerCase().includes(lowerSearch);
    const topicMatch = (post.topics || []).some(topic =>
      topic.toLowerCase().includes(lowerSearch)
    );
    return titleMatch || topicMatch;
  });

  if (loading) return <p className="loading-text">Loading posts...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="home-container">

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="overlay">
          <h1 className="hero-title">Explore Latest Posts & Stories</h1>
          <p className="hero-subtitle">Stay updated with fresh content and insights</p>
        </div>
      </div>

      <h1 className="home-title">Latest Posts</h1>
      <div className="search-bar-container" style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSearchDropdown(true)}
          onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)} // delay to allow click on dropdown
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchSubmit();
            }
          }}
          className="search-input"
          spellCheck={false}
          autoComplete="off"
        />

        {showSearchDropdown && previousSearches.length > 0 && (
          <ul className="search-dropdown">
            {previousSearches.map((term, idx) => (
              <li
                key={idx}
                onMouseDown={() => { // use onMouseDown to avoid blur before click
                  setSearchTerm(term);
                  setShowSearchDropdown(false);
                }}
                className="search-dropdown-item"
              >
                {term}
              </li>
            ))}
          </ul>
        )}
      </div>

      {filteredPosts.length === 0 ? (
        <p className="empty-text">No posts found.</p>
      ) : (
        filteredPosts.map(post => {
          const liked = likes[post._id]?.liked;
          const count = likes[post._id]?.count || 0;
          const visible = commentsVisible[post._id] || false;
          const postComments = comments[post._id] || [];

          return (
            <div key={post._id} className="post-card">
              <div className="post-header">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt={post.author.username} className="avatar" />
                ) : (
                  <UserCircle2 size={40} />
                )}
                <div className="post-author-info">
                  <strong>{post.author.username}</strong>
                  <small>{formatDate(post.createdAt)}</small>
                </div>
              </div>

              <h2 className="post-title">{post.title}</h2>
              <div className="post-content">
                {expandedPosts[post._id] || post.content.length <= 300
                  ? parse(post.content)
                  : parse(post.content.slice(0, 300) + '...')}
                {post.content.length > 300 && (
                  <button
                    className="toggle-content-btn"
                    onClick={() =>
                      setExpandedPosts(prev => ({
                        ...prev,
                        [post._id]: !prev[post._id]
                      }))
                    }
                  >
                    {expandedPosts[post._id] ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>

              {post.image && (
                <img
                  src={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/uploads/${post.image}`}
                  alt="Post visual"
                  className="post-image"
                />
              )}

              <div className="post-actions">
                <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={() => handleLike(post._id)} aria-label="Like post">
                  <Heart size={20} fill={liked ? 'red' : 'none'} stroke={liked ? 'red' : 'currentColor'} />
                  <span>{count > 0 ? count : ''}</span>
                </button>
                <button className="share-btn" onClick={() => handleShare(post._id)} aria-label="Share post">
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>

              <div className="comments-toggle">
                <button className="toggle-comments-btn" onClick={() => toggleComments(post._id)} aria-expanded={visible}>
                  {visible ? (
                    <>Hide comments <ChevronUp size={16} /></>
                  ) : (
                    <>Show comments ({postComments.length}) <ChevronDown size={16} /></>
                  )}
                </button>
              </div>

              {visible && (
                <div className="comments-section">
                  {user ? (
                    <div className="comment-input">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComments[post._id] || ''}
                        onChange={e => setNewComments(prev => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post._id)}
                        spellCheck={false}
                      />
                      <button onClick={() => handleComment(post._id)}>Comment</button>
                    </div>
                  ) : (
                    <div className="comment-input">
                      <input type="text" placeholder="Login to comment" disabled />
                      <button onClick={redirectToLogin}>Login</button>
                    </div>
                  )}

                  <div className="comments-list">
                    {postComments.length === 0 ? (
                      <p className="no-comments">No comments yet.</p>
                    ) : (
                      postComments.map(comment => (
                        <div key={comment._id} className="comment">
                          <strong>{comment.user?.username || 'Deleted User'}</strong>: {comment.text}

                          {user && user._id === comment.user?._id && (
                            <div className="comment-actions">
                              <button
                                className="three-dots"
                                onClick={() =>
                                  setCommentDropdownVisible(prev => ({
                                    ...prev,
                                    [comment._id]: !prev[comment._id]
                                  }))
                                }
                                aria-label="More options"
                              >
                                &#8942;
                              </button>

                              {commentDropdownVisible[comment._id] && (
                                <div className="dropdown-menu">
                                  <button onClick={() => handleDeleteComment(post._id, comment._id)}>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
