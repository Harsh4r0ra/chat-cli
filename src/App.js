import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import TerminalChat from './components/TerminalChat';
import NotesEditor from './components/NotesEditor';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
            <button onClick={handleLogout} className="logout-button">
              logout
            </button>
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
    </div>
  );
}

export default App; 