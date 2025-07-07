import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import './TerminalChat.css';

export default function TerminalChat({ user, setUser }) {
  const [messages, setMessages] = useState([
    { id: 0, text: 'Welcome! Type /login or /register to begin.', system: true }
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
    const { data, error } = await supabase
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
    if (e.key === 'Enter' && input.trim()) {
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
    }
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
        setMessages([{ id: 0, text: 'Logged out. Type /login or /register to begin.', system: true }]);
        break;
      default:
        addSystemMessage(`Unknown command: ${cmd}. Type /help for available commands.`);
    }
  };

  const sendMessage = async (text) => {
    const username = user?.email?.split('@')[0] || 'anonymous';
    const { error } = await supabase.from('messages').insert([{ username, text }]);
    if (error) addSystemMessage('Error sending message: ' + error.message);
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, system: true }]);
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
                <span className="prompt">{msg.username}@chat:~$</span> {msg.text}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="input-row">
        <span className="prompt">{currentUser}@chat:~$</span>
        <input
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={
            authStep === 'login-email' || authStep === 'register-email'
              ? 'Enter email...'
              : authStep === 'login-password' || authStep === 'register-password'
              ? 'Enter password...'
              : '[Type your message or command here...]'
          }
          type={
            authStep === 'login-password' || authStep === 'register-password'
              ? 'password'
              : 'text'
          }
          autoFocus
        />
      </div>
    </div>
  );
} 