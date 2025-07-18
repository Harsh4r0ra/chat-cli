# 🖥️ Terminal Chat - Real-time Collaborative Chat & Notes

A modern web application that mimics the nostalgic feel of old IRC chatrooms with a Linux terminal interface. Features real-time chat, collaborative notes editing, and persistent authentication.

![Terminal Chat Demo](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-18.0.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Real--time-orange)

## ✨ Features

### 🗨️ **Real-time Multi-Room Chat**
- Terminal-style chat interface with command-line aesthetics
- Real-time messaging using Supabase real-time subscriptions
- Multi-room support with `/room roomname` command
- Admins can create/delete rooms and control access
- Reply to specific messages with context
- User authentication with persistent sessions
- Command system (`/login`, `/register`, `/logout`, `/help`, `/room`, `/makeadmin`)

### 📝 **Collaborative Notes Editor (Admin Room Only)**
- Cell-based notes system where each line is a separate database record
- Real-time collaborative editing (only visible in the admin room)
- Smart navigation with arrow keys and Enter key
- Auto-scroll to new cells
- Dracula theme terminal styling

### 🔐 **Admin Panel**
- View user stats and active users
- Block, unblock, or timeout users
- Promote users to admin with `/makeadmin username`
- Manage chatrooms (create/delete)
- Visual status indicators for users

### 🎨 **UI/UX**
- Dracula theme terminal interface
- Responsive design
- Smooth animations and transitions
- Keyboard navigation support

## 🚀 Live Demo

Visit the live application: [Terminal Chat Demo](https://your-deployment-url.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: React 18, CSS3
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Deployment**: Vercel
- **Styling**: Custom CSS with Dracula theme

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/terminal-chat.git
cd terminal-chat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create the required database tables:

#### Messages Table
```sql
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Note Cells Table
```sql
CREATE TABLE note_cells (
  id BIGSERIAL PRIMARY KEY,
  content TEXT DEFAULT '',
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the Application

```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🎮 Usage Guide

### Authentication

1. **Login**: Type `/login` in the chat input
2. **Register**: Type `/register` in the chat input
3. **Logout**: Click the logout button in the header or type `/logout`
4. **Reset Password**: Type `/resetpassword` and follow the prompt to receive a password reset link
5. **Magic Link Login**: Type `/magiclink` and follow the prompt to receive a magic login link

### Chat Commands

- `/login` - Start login process
- `/register` - Start registration process
- `/logout` - Sign out
- `/help` - Show available commands
- `/room roomname` - Switch to a chatroom (admins can create rooms on demand)
- `/makeadmin username` - (Admin only) Promote a user to admin by their username (email prefix)
- `/resetpassword` - Send a password reset link to your email
- `/magiclink` - Send a magic login link to your email

### Multi-Room & Admin Room

- Use `/room roomname` to switch between chatrooms.
- The `admin` room is only accessible to admins. Collaborative notes are only visible in this room.
- Admins can use `/makeadmin username` to promote other users to admin.

### Notes Editor (Admin Room Only)

- Only visible in the admin room.
- **Arrow Keys**: Navigate between cells
- **Enter**: Move to next empty cell or create new cell
- **Click**: Focus any cell for editing
- **Real-time Sync**: Changes appear instantly for all admins in the admin room
- **Auto-save**: Content is saved automatically
- **Collaborative**: Multiple admins can edit simultaneously
- **Smart Navigation**: Enter key intelligently finds empty cells

### Reply to Messages

- Click the reply button on any message to reply with context.
- Replies show the original message and user for context.

## 🏗️ Project Structure

```
src/
├── components/
│   ├── TerminalChat.js      # Main chat component
│   ├── TerminalChat.css     # Chat styling
│   ├── NotesEditor.js       # Notes editor component
│   └── NotesEditor.css      # Notes styling
├── App.js                   # Main app component
├── App.css                  # App styling
├── supabase.js             # Supabase client configuration
└── index.js                # App entry point
```

## 🔄 Real-time Features

### Chat
- Real-time message broadcasting
- User presence indicators
- Instant message delivery

### Notes
- Cell-level real-time synchronization
- Collaborative editing with conflict resolution
- Live updates across all connected clients

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Environment Variables**
   - Add your Supabase environment variables in Vercel dashboard
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

3. **Deploy**
   - Vercel will automatically build and deploy your app
   - Your app will be available at `https://your-app.vercel.app`

### Manual Deployment

```bash
npm run build
```

The built files will be in the `build/` directory.

## 🔧 Configuration

### Supabase Configuration

The app uses Supabase with the following configuration:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'terminal-chat-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
```

### Real-time Subscriptions

The app subscribes to real-time updates for:
- `messages` table - for chat functionality
- `note_cells` table - for collaborative notes

## 🐛 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check your Supabase environment variables
   - Ensure your Supabase project has auth enabled

2. **Real-time not working**
   - Verify your Supabase project has real-time enabled
   - Check browser console for connection errors

3. **Notes not saving**
   - Ensure the `note_cells` table exists in your database
   - Check Supabase RLS (Row Level Security) policies

### Debug Mode

Enable debug logging by adding to your browser console:

```javascript
localStorage.setItem('supabase.debug', 'true')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend infrastructure
- [Vercel](https://vercel.com) for hosting
- [Dracula Theme](https://draculatheme.com) for the color scheme inspiration
- The IRC community for the nostalgic chatroom inspiration

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/terminal-chat/issues) page
2. Create a new issue with detailed information
3. Include browser console logs if applicable

---

**Made with ❤️ for the terminal enthusiasts** 