import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import './TerminalChat.css';

export default function TerminalChat({ user, setUser }) {
  const [messages, setMessages] = useState([
    { id: 0, text: 'Welcome! Type /login or /register to begin.', system: true, inserted_at: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [authStep, setAuthStep] = useState(null);
  const [pendingAuth, setPendingAuth] = useState({});
  const chatWindowRef = useRef(null);

  // Fetch messages and subscribe to new ones
  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('inserted_at', { ascending: true });
    if (data) setMessages(data);
  };

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
        addSystemMessage('Available commands: /help, /logout');
        break;
      case '/logout':
        await supabase.auth.signOut();
        setUser(null);
        setMessages([{ id: 0, text: 'Logged out. Type /login or /register to begin.', system: true, inserted_at: new Date().toISOString() }]);
        break;
      default:
        addSystemMessage(`Unknown command: ${cmd}. Type /help for available commands.`);
    }
  };

  const sendMessage = async (text) => {
    const username = user?.email?.split('@')[0] || 'anonymous';
    const { error } = await supabase.from('messages').insert([{ 
      username, 
      text
    }]);
    if (error) addSystemMessage('Error sending message: ' + error.message);
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
                <span className="prompt">{msg.username}@chat:~$</span> 
                <span className="message-text">{msg.text}</span>
                <span className="timestamp">{formatTimestamp(msg.inserted_at)}</span>
              </>
            )}
          </div>
        ))}
      </div>
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
              : '[Type your message or command here... (Shift+Enter for new line)]'
          }
          rows={1}
          autoFocus
        />
      </div>
    </div>
  );
} 