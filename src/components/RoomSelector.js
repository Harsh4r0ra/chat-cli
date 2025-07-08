import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './RoomSelector.css';

export default function RoomSelector({ currentRoom, onRoomChange, user }) {
  const [rooms, setRooms] = useState([]);
  const [userPermissions, setUserPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchUserPermissions();
    }
  }, [user]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chatrooms')
        .select('*')
        .order('display_name');

      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }

      setRooms(data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_room_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      // Convert to object for easy lookup
      const permissions = {};
      data.forEach(perm => {
        permissions[perm.room_name] = {
          can_read: perm.can_read,
          can_write: perm.can_write
        };
      });

      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const canAccessRoom = (room) => {
    // Public rooms are accessible to everyone
    if (room.is_public) return true;
    
    // Check user permissions
    const permission = userPermissions[room.name];
    return permission && permission.can_read;
  };

  const handleRoomChange = (roomName) => {
    onRoomChange(roomName);
  };

  if (loading) {
    return (
      <div className="room-selector">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  const accessibleRooms = rooms.filter(canAccessRoom);

  return (
    <div className="room-selector">
      <div className="room-list">
        {accessibleRooms.map((room) => (
          <button
            key={room.name}
            className={`room-item ${currentRoom === room.name ? 'active' : ''}`}
            onClick={() => handleRoomChange(room.name)}
            title={room.description}
          >
            <span className="room-name">{room.display_name}</span>
            {!room.is_public && (
              <span className="room-private">🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 