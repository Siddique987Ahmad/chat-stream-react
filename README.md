# 🚀 Next-Gen Dual-Mode Chat Application

A high-performance, premium chat application built with **React**, **Stream Chat**, **Socket.IO**, and **Supabase**. This app features a unique dual-engine architecture, allowing users to switch between a fully-managed Stream Chat experience and a custom-built Socket.IO implementation.

![Project Preview](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Built%20With-React%20%7C%20Socket.IO%20%7C%20Supabase-blue?style=for-the-badge)

## 🌟 Key Features

### 📡 Dual Chat Engines
- **Stream Chat Mode**: Leveraging the power of GetStream.io for a scalable, polished messaging experience.
- **Socket.IO Mode**: A custom, real-time messaging engine built from the ground up for maximum control and zero external dependencies.

### 📞 Advanced Communication (Socket.IO)
- **WebRTC Calling**: Integrated peer-to-peer Voice and Video calling directly in the chat.
- **WhatsApp reactions**: Real-time emoji reactions (❤️, 👍, 😂, etc.) with persistent storage.
- **File Sharing**: Seamless image and document sharing powered by **Supabase Storage**.

### 🔐 Authentication & Persistence
- **Flexible Login**: Support for both Email/Password and **Anonymous Guest** access.
- **Database Persistence**: All Socket.IO messages and reactions are saved to **Supabase Database**, ensuring they survive page refreshes and server restarts.

### 🎨 Premium UI/UX
- **Glassmorphic Design**: A sleek, dark-mode interface with translucent backgrounds and vibrant accents.
- **Responsive Layout**: Optimized for both desktop and mobile viewing.
- **Micro-animations**: Smooth transitions and hover states using custom CSS and Tailwind.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend (Signaling)**: Node.js, Express, Socket.IO.
- **Infrastructure**: Supabase (Auth, DB, Storage).
- **Communication SDK**: Stream Chat React SDK.

---

## 🚀 Getting Started

### 1. Prerequisites
- A **Supabase** account and project.
- A **Stream Chat** API Key (Dev/Production).

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_STREAM_API_KEY=your_stream_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
```

### 4. Database Setup (Socket.IO Persistence)
Run the SQL script found in `supabase_setup.sql` in your **Supabase SQL Editor** to create the necessary tables for messages and reactions.

### 5. Create Storage Bucket
Create a **Public** bucket named `chat-files` in your Supabase Storage dashboard to enable file sharing.

### 6. Run the Application
```bash
# Start the Socket.IO Server (in /server)
npm run dev

# Start the Vite Frontend (in root)
npm run dev
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── SocketChatApp.tsx   # Custom Socket.IO Engine
│   │   ├── ChatApp.tsx         # Stream Chat Engine
│   │   ├── CallOverlay.tsx     # WebRTC Video/Audio UI
│   │   └── Auth.tsx            # Supabase Auth logic
│   ├── hooks/
│   │   ├── useSocket.ts        # Socket connection manager
│   │   └── useWebRTC.ts        # Calling logic engine
│   └── lib/
│       └── supabase.ts         # Supabase client config
├── server/
│   └── index.js                # Socket.IO & Persistence Server
└── supabase_setup.sql          # Database schema migrations
```

## 🤝 Contributing
Feel free to fork this project and submit PRs if you have ideas for new features or improvements.

---

*Built with ❤️ for the future of real-time communication.*
