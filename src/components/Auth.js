import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-terminal">
        <div className="auth-header">
          <span className="prompt">root@terminal:~$</span>
          <span className="auth-title">Terminal Chat Authentication</span>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <span className="prompt">user@terminal:~$</span>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          
          <div className="form-group">
            <span className="prompt">user@terminal:~$</span>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
          </div>
          
          {error && (
            <div className="error-msg">
              <span className="prompt">system@terminal:~$</span> Error: {error}
            </div>
          )}
          
          <div className="form-group">
            <button type="submit" className="auth-button">
              {isLogin ? 'login' : 'register'}
            </button>
          </div>
        </form>
        
        <div className="auth-switch">
          <span className="prompt">system@terminal:~$</span>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="switch-button"
          >
            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
} 