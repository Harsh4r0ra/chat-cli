import React, { useState } from "react";
import "./TerminalChatMockup.css"; // See CSS below

const mockMessages = [
  { system: true, text: "[general] Welcome to the general chatroom!" },
  { username: "alice", text: "Hi everyone!" },
  { username: "bob", text: "Hello Alice!" },
  { username: "user", text: "/list" },
  { system: true, text: "Available rooms: general, tech, random" },
  { username: "user", text: "/help" },
  { system: true, text: "Available commands: /join, /leave, /list, /help" },
];

export default function TerminalChatMockup() {
  const [input, setInput] = useState("");
  const currentUser = "user";

  return (
    <div className="terminal-container">
      <div className="chat-window">
        {mockMessages.map((msg, idx) =>
          msg.system ? (
            <div key={idx} className="system-msg">{msg.text}</div>
          ) : (
            <div key={idx} className="user-msg">
              <span className="prompt">{msg.username}@chat:~$</span> {msg.text}
            </div>
          )
        )}
      </div>
      <div className="input-row">
        <span className="prompt">{currentUser}@chat:~$</span>
        <input
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="[Type your message or command here...]"
          autoFocus
        />
      </div>
    </div>
  );
} 