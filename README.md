# Terminal Chat App

A retro-style chat application that mimics old chatrooms with a Linux terminal interface. Built with React and Firebase.

## Features

- 🔐 Firebase Authentication (email/password)
- 💬 Real-time chat with multiple rooms
- 🖥️ Terminal-style UI with commands
- 🎨 Retro terminal aesthetic
- 📱 Responsive design

## Commands

- `/join <room>` - Join a chatroom
- `/leave` - Leave current room
- `/list` - List available rooms
- `/help` - Show available commands

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your Firebase config from Project Settings > General > Your apps
5. Replace the placeholder values in `src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Firestore Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{message} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Run the App

```bash
npm start
```

The app will open at `http://localhost:3000`

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Build the App

```bash
npm run build
```

### 3. Deploy

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### 4. Environment Variables (Optional)

For production, you can set environment variables in Vercel:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- etc.

## Project Structure

```
src/
├── components/
│   ├── Auth.js          # Authentication component
│   ├── Auth.css         # Auth styles
│   ├── TerminalChat.js  # Main chat component
│   └── TerminalChat.css # Chat styles
├── firebase.js          # Firebase configuration
├── App.js              # Main app component
├── App.css             # App styles
├── index.js            # App entry point
└── index.css           # Global styles
```

## Technologies Used

- React 18
- Firebase (Authentication & Firestore)
- CSS3
- Vercel (Deployment)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 