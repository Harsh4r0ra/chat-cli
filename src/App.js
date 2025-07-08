import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import TerminalChat from './components/TerminalChat';
import NotesEditor from './components/NotesEditor';
import AdminPanel from './components/AdminPanel';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setIsAdmin(data.is_admin === true);
          } else {
            // If table doesn't exist or other error, user is not admin
            console.log('User profiles table not available, user is not admin');
            setIsAdmin(false);
          }
        } catch (err) {
          console.error('Error checking admin status:', err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-terminal">
          <span className="prompt">system@terminal:~$</span>
          <span className="loading-text">Loading Terminal Chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="chat-app">
        {user && (
          <div className="header">
            <span className="prompt">system@terminal:~$</span>
            <span className="user-info">Logged in as: {user.email}</span>
            <div className="header-actions">
              {isAdmin && (
                <button 
                  onClick={() => setShowAdminPanel(true)} 
                  className="admin-button"
                  title="Open Admin Panel"
                >
                  admin
                </button>
              )}
              <button onClick={handleLogout} className="logout-button">
                logout
              </button>
            </div>
          </div>
        )}
        <div className="main-content">
          <div className="chat-section">
            <TerminalChat user={user} setUser={setUser} />
          </div>
          <div className="notes-section">
            <NotesEditor user={user} />
          </div>
        </div>
      </div>

      {showAdminPanel && isAdmin && (
        <AdminPanel 
          user={user} 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
    </div>
  );
}

export default App; 