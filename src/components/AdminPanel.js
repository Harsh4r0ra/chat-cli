import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './AdminPanel.css';

export default function AdminPanel({ user, onClose }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    blockedUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeoutDuration, setTimeoutDuration] = useState(3600); // 1 hour default
  const [timeoutReason, setTimeoutReason] = useState('');
  const [chatrooms, setChatrooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [newRoom, setNewRoom] = useState({
    name: '',
    display_name: '',
    description: '',
    is_public: false
  });
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchStats();
      fetchChatrooms();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in within last 24 hours)
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get total messages
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Get blocked users
      const { count: blockedUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMessages: totalMessages || 0,
        blockedUsers: blockedUsers || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchChatrooms = async () => {
    setLoadingRooms(true);
    try {
      const { data, error } = await supabase
        .from('chatrooms')
        .select('*')
        .order('display_name');
      if (error) {
        console.error('Error fetching chatrooms:', error);
        return;
      }
      setChatrooms(data || []);
    } catch (err) {
      console.error('Error fetching chatrooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const blockUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_blocked: true, 
          blocked_at: new Date().toISOString(),
          blocked_reason: 'Admin action'
        })
        .eq('id', userId);

      if (error) {
        console.error('Error blocking user:', error);
        alert('Error blocking user: ' + error.message);
      } else {
        alert('User blocked successfully');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Error blocking user');
    }
  };

  const unblockUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_blocked: false, 
          blocked_at: null,
          blocked_reason: null
        })
        .eq('id', userId);

      if (error) {
        console.error('Error unblocking user:', error);
        alert('Error unblocking user: ' + error.message);
      } else {
        alert('User unblocked successfully');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Error unblocking user');
    }
  };

  const timeoutUser = async (userId) => {
    if (!timeoutReason.trim()) {
      alert('Please provide a reason for the timeout');
      return;
    }

    try {
      const timeoutUntil = new Date(Date.now() + timeoutDuration * 1000).toISOString();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          timeout_until: timeoutUntil,
          timeout_reason: timeoutReason,
          timeout_duration: timeoutDuration
        })
        .eq('id', userId);

      if (error) {
        console.error('Error timing out user:', error);
        alert('Error timing out user: ' + error.message);
      } else {
        alert('User timed out successfully');
        setTimeoutReason('');
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error timing out user:', err);
      alert('Error timing out user');
    }
  };

  const removeTimeout = async (userId) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          timeout_until: null,
          timeout_reason: null,
          timeout_duration: null
        })
        .eq('id', userId);

      if (error) {
        console.error('Error removing timeout:', error);
        alert('Error removing timeout: ' + error.message);
      } else {
        alert('Timeout removed successfully');
        fetchUsers();
      }
    } catch (err) {
      console.error('Error removing timeout:', err);
      alert('Error removing timeout');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isUserTimedOut = (user) => {
    if (!user.timeout_until) return false;
    return new Date(user.timeout_until) > new Date();
  };

  const isUserBlocked = (user) => {
    return user.is_blocked === true;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim() || !newRoom.display_name.trim()) {
      alert('Room name and display name are required.');
      return;
    }
    setCreatingRoom(true);
    try {
      const { error } = await supabase
        .from('chatrooms')
        .insert({
          name: newRoom.name.trim(),
          display_name: newRoom.display_name.trim(),
          description: newRoom.description.trim(),
          is_public: newRoom.is_public,
          created_by: user.id
        });
      if (error) {
        alert('Error creating chatroom: ' + error.message);
      } else {
        setNewRoom({ name: '', display_name: '', description: '', is_public: false });
        fetchChatrooms();
      }
    } catch (err) {
      alert('Error creating chatroom');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomName) => {
    if (!window.confirm('Are you sure you want to delete this chatroom? This cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('chatrooms')
        .delete()
        .eq('name', roomName);
      if (error) {
        alert('Error deleting chatroom: ' + error.message);
      } else {
        fetchChatrooms();
      }
    } catch (err) {
      alert('Error deleting chatroom');
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="loading">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="admin-content">
        <div className="stats-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeUsers}</div>
              <div className="stat-label">Active Users (24h)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalMessages}</div>
              <div className="stat-label">Total Messages</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.blockedUsers}</div>
              <div className="stat-label">Blocked Users</div>
            </div>
          </div>
        </div>

        <div className="chatrooms-section">
          <h3>Chatroom Management</h3>
          <form className="create-room-form" onSubmit={handleCreateRoom}>
            <input
              type="text"
              placeholder="Room name (unique, no spaces)"
              value={newRoom.name}
              onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
              required
              pattern="^[a-zA-Z0-9_-]+$"
              minLength={2}
              maxLength={32}
              disabled={creatingRoom}
            />
            <input
              type="text"
              placeholder="Display name"
              value={newRoom.display_name}
              onChange={e => setNewRoom({ ...newRoom, display_name: e.target.value })}
              required
              minLength={2}
              maxLength={32}
              disabled={creatingRoom}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newRoom.description}
              onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
              maxLength={100}
              disabled={creatingRoom}
            />
            <label className="public-toggle">
              <input
                type="checkbox"
                checked={newRoom.is_public}
                onChange={e => setNewRoom({ ...newRoom, is_public: e.target.checked })}
                disabled={creatingRoom}
              />
              Public room
            </label>
            <button type="submit" className="action-btn create-btn" disabled={creatingRoom}>
              {creatingRoom ? 'Creating...' : 'Create Room'}
            </button>
          </form>
          <div className="chatrooms-list">
            {loadingRooms ? (
              <div className="loading">Loading chatrooms...</div>
            ) : (
              chatrooms.map(room => (
                <div key={room.name} className="chatroom-card">
                  <div className="chatroom-info">
                    <span className="chatroom-name">{room.display_name}</span>
                    <span className="chatroom-id">({room.name})</span>
                    {room.is_public && <span className="chatroom-public">Public</span>}
                    {!room.is_public && <span className="chatroom-private">Private</span>}
                    <span className="chatroom-desc">{room.description}</span>
                  </div>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteRoom(room.name)}
                    disabled={room.name === 'general'}
                    title={room.name === 'general' ? 'Cannot delete the general room' : 'Delete chatroom'}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="users-section">
          <h3>User Management</h3>
          <div className="users-list">
            {users.map((user) => (
              <div key={user.id} className={`user-card ${isUserBlocked(user) ? 'blocked' : ''} ${isUserTimedOut(user) ? 'timed-out' : ''}`}>
                <div className="user-info">
                  <div className="user-email">{user.email}</div>
                  <div className="user-details">
                    <span>Joined: {formatDate(user.created_at)}</span>
                    <span>Last seen: {formatDate(user.last_seen)}</span>
                    {user.is_blocked && <span className="status blocked">BLOCKED</span>}
                    {isUserTimedOut(user) && <span className="status timed-out">TIMED OUT</span>}
                  </div>
                </div>
                <div className="user-actions">
                  {!isUserBlocked(user) ? (
                    <button 
                      className="action-btn block-btn"
                      onClick={() => blockUser(user.id)}
                      title="Block user"
                    >
                      Block
                    </button>
                  ) : (
                    <button 
                      className="action-btn unblock-btn"
                      onClick={() => unblockUser(user.id)}
                      title="Unblock user"
                    >
                      Unblock
                    </button>
                  )}
                  
                  {!isUserTimedOut(user) ? (
                    <button 
                      className="action-btn timeout-btn"
                      onClick={() => setSelectedUser(user)}
                      title="Timeout user"
                    >
                      Timeout
                    </button>
                  ) : (
                    <button 
                      className="action-btn remove-timeout-btn"
                      onClick={() => removeTimeout(user.id)}
                      title="Remove timeout"
                    >
                      Remove Timeout
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedUser && (
          <div className="timeout-modal">
            <div className="modal-content">
              <h3>Timeout User: {selectedUser.email}</h3>
              <div className="timeout-form">
                <div className="form-group">
                  <label>Duration (seconds):</label>
                  <select 
                    value={timeoutDuration} 
                    onChange={(e) => setTimeoutDuration(parseInt(e.target.value))}
                  >
                    <option value={300}>5 minutes</option>
                    <option value={900}>15 minutes</option>
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={7200}>2 hours</option>
                    <option value={14400}>4 hours</option>
                    <option value={86400}>24 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reason:</label>
                  <textarea
                    value={timeoutReason}
                    onChange={(e) => setTimeoutReason(e.target.value)}
                    placeholder="Enter reason for timeout..."
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="action-btn timeout-btn"
                    onClick={() => timeoutUser(selectedUser.id)}
                  >
                    Apply Timeout
                  </button>
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => {
                      setSelectedUser(null);
                      setTimeoutReason('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 