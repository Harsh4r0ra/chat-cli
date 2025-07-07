import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import TerminalChat from './components/TerminalChat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
        <TerminalChat user={user} setUser={setUser} />
      </div>
    </div>
  );
}

export default App; 