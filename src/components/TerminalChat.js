import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import './TerminalChat.css';

export default function TerminalChat({ user, setUser }) {
  const [messages, setMessages] = useState([
    { id: 0, text: 'Welcome! Type /login or /register to begin.', system: true, inserted_at: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [authStep, setAuthStep] = useState(null);
  const [pendingAuth, setPendingAuth] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const chatWindowRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .gte('inserted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('inserted_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const cleanupOldMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .lt('inserted_at', twentyFourHoursAgo);
      
      if (error) {
        console.error('Error cleaning up old messages:', error);
      } else {
        console.log('Old messages cleaned up successfully');
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }, [user]);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    if (!user) return;
    fetchMessages();
    cleanupOldMessages();
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, cleanupOldMessages]);

  // Set up periodic cleanup every hour
  useEffect(() => {
    if (!user) return;
    
    const cleanupInterval = setInterval(() => {
      cleanupOldMessages();
    }, 60 * 60 * 1000); // Run every hour
    
    return () => clearInterval(cleanupInterval);
  }, [user, cleanupOldMessages]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputKeyDown = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault(); // Prevent default to avoid multiple sends
      const trimmedInput = input.trim();
      if (!user) {
        await handleAuthFlow(trimmedInput);
      } else if (authStep) {
        await handleAuthFlow(trimmedInput);
      } else if (trimmedInput.startsWith('/')) {
        await handleCommand(trimmedInput);
      } else {
        await sendMessage(trimmedInput);
      }
      setInput('');
      // Reset textarea height after sending
      setTimeout(() => {
        const textarea = document.querySelector('.terminal-input');
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      }, 0);
    }
    // Allow Shift+Enter for new lines
    if (e.key === 'Enter' && e.shiftKey) {
      // Let the default behavior happen (new line in textarea)
      return;
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, window.innerHeight * 0.3 - 32) + 'px';
  };

  // Auth flow using Supabase
  const handleAuthFlow = async (inputValue) => {
    if (!authStep) {
      if (inputValue === '/login') {
        setAuthStep('login-email');
        addSystemMessage('Enter your email:');
      } else if (inputValue === '/register') {
        setAuthStep('register-email');
        addSystemMessage('Enter your email:');
      } else {
        addSystemMessage('Please type /login or /register to begin.');
      }
      return;
    }
    if (authStep === 'login-email') {
      setPendingAuth({ email: inputValue });
      setAuthStep('login-password');
      addSystemMessage('Enter your password:');
      return;
    }
    if (authStep === 'login-password') {
      const { email } = pendingAuth;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: inputValue });
      if (data?.user) {
        setUser(data.user);
        setAuthStep(null);
        setPendingAuth({});
        addSystemMessage('Login successful!');
      } else {
        addSystemMessage('Login failed: ' + (error?.message || 'Unknown error'));
        setAuthStep(null);
        setPendingAuth({});
      }
      return;
    }
    if (authStep === 'register-email') {
      setPendingAuth({ email: inputValue });
      setAuthStep('register-password');
      addSystemMessage('Enter your password:');
      return;
    }
    if (authStep === 'register-password') {
      const { email } = pendingAuth;
      const { data, error } = await supabase.auth.signUp({ email, password: inputValue });
      if (data?.user) {
        setUser(data.user);
        setAuthStep(null);
        setPendingAuth({});
        addSystemMessage('Registration successful!');
      } else {
        addSystemMessage('Registration failed: ' + (error?.message || 'Unknown error'));
        setAuthStep(null);
        setPendingAuth({});
      }
      return;
    }
  };

  const handleCommand = async (command) => {
    const cmd = command.split(' ')[0].toLowerCase();
    switch (cmd) {
      case '/help':
        addSystemMessage('Available commands: /help, /logout, /cleanup');
        break;
      case '/logout':
        await supabase.auth.signOut();
        setUser(null);
        setMessages([{ id: 0, text: 'Logged out. Type /login or /register to begin.', system: true, inserted_at: new Date().toISOString() }]);
        break;
      case '/cleanup':
        await cleanupOldMessages();
        addSystemMessage('Chat cleanup completed. Messages older than 24 hours have been removed.');
        break;
      default:
        addSystemMessage(`Unknown command: ${cmd}. Type /help for available commands.`);
    }
  };

  const sendMessage = async (text) => {
    // Check if user is blocked or timed out (only if user_profiles table exists)
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_blocked, timeout_until')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If table doesn't exist or other error, just send the message normally
        console.log('User profiles table not available, sending message without moderation checks');
        const username = user?.email?.split('@')[0] || 'anonymous';
        const { error } = await supabase.from('messages').insert([{ 
          username, 
          text,
          reply_to: replyingTo ? replyingTo.id : null,
          reply_to_username: replyingTo ? replyingTo.username : null,
          reply_to_text: replyingTo ? replyingTo.text : null
        }]);
        if (error) addSystemMessage('Error sending message: ' + error.message);
        else {
          setReplyingTo(null); // Clear reply state after sending
        }
        return;
      }

      if (userProfile.is_blocked) {
        addSystemMessage('Error: Your account has been blocked by an administrator.');
        return;
      }

      if (userProfile.timeout_until && new Date(userProfile.timeout_until) > new Date()) {
        const timeoutEnd = new Date(userProfile.timeout_until);
        const timeLeft = Math.ceil((timeoutEnd - new Date()) / 1000 / 60);
        addSystemMessage(`Error: You are currently timed out. Time remaining: ${timeLeft} minutes`);
        return;
      }

      const username = user?.email?.split('@')[0] || 'anonymous';
      const { error } = await supabase.from('messages').insert([{ 
        username, 
        text,
        reply_to: replyingTo ? replyingTo.id : null,
        reply_to_username: replyingTo ? replyingTo.username : null,
        reply_to_text: replyingTo ? replyingTo.text : null
      }]);
      if (error) addSystemMessage('Error sending message: ' + error.message);
      else {
        setReplyingTo(null); // Clear reply state after sending
      }
    } catch (err) {
      // If any error occurs, fall back to sending message without moderation
      console.log('Error checking user status, sending message without moderation:', err);
      const username = user?.email?.split('@')[0] || 'anonymous';
      const { error } = await supabase.from('messages').insert([{ 
        username, 
        text,
        reply_to: replyingTo ? replyingTo.id : null,
        reply_to_username: replyingTo ? replyingTo.username : null,
        reply_to_text: replyingTo ? replyingTo.text : null
      }]);
      if (error) addSystemMessage('Error sending message: ' + error.message);
      else {
        setReplyingTo(null); // Clear reply state after sending
      }
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    // Focus on input
    setTimeout(() => {
      const textarea = document.querySelector('.terminal-input');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      text, 
      system: true, 
      inserted_at: new Date().toISOString() 
    }]);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentUser = user ? user.email.split('@')[0] : 'guest';

  return (
    <div className="terminal-container">
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.system ? 'system-msg' : 'user-msg'}>
            {msg.system ? (
              <span className="system-text">{msg.text}</span>
            ) : (
              <>
                <div className="message-content">
                  {msg.reply_to && (
                    <div className="reply-context">
                      <span className="reply-label">↳ Replying to {msg.reply_to_username}:</span>
                      <span className="reply-text">{msg.reply_to_text}</span>
                    </div>
                  )}
                  <div className="message-line">
                    <span className="prompt">{msg.username}@chat:~$</span> 
                    <span className="message-text">{msg.text}</span>
                    <span className="timestamp">{formatTimestamp(msg.inserted_at)}</span>
                  </div>
                  {!msg.system && (
                    <button 
                      className="reply-btn"
                      onClick={() => handleReply(msg)}
                      title="Reply to this message"
                    >
                      ↳ Reply
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {replyingTo && (
        <div className="reply-preview">
          <span className="reply-preview-label">↳ Replying to {replyingTo.username}:</span>
          <span className="reply-preview-text">{replyingTo.text}</span>
          <button className="cancel-reply-btn" onClick={cancelReply} title="Cancel reply">
            ×
          </button>
        </div>
      )}
      
      <div className="input-row">
        <span className="prompt">{currentUser}@chat:~$</span>
        <textarea
          className="terminal-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={
            authStep === 'login-email' || authStep === 'register-email'
              ? 'Enter email...'
              : authStep === 'login-password' || authStep === 'register-password'
              ? 'Enter password...'
              : replyingTo 
                ? `[Replying to ${replyingTo.username}...]`
                : '[Type your message or command here...]'
          }
          rows={1}
          autoFocus
        />
      </div>
    </div>
  );
} 