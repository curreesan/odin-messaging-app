# Odin Messaging App

A full-stack real-time messaging application built as part of [The Odin Project](https://www.theodinproject.com/lessons/nodejs-messaging-app) curriculum.

## Live Demo

- **Frontend:** https://odin-messaging-app-frontend.onrender.com
- **Backend API:** https://odin-messaging-app-backend-f9j2.onrender.com

## Features

- **Authentication** — Sign up and login via Supabase Auth
- **Profiles** — Create and edit your profile with a display name, bio, and avatar
- **Friend System** — Search users by username, send friend requests, accept or reject incoming requests
- **Real-time Messaging** — Send and receive messages instantly using WebSockets (Socket.io)
- **Conversations** — Start conversations with friends, view message history, see last message preview in sidebar

## Tech Stack

### Frontend

- React (Vite)
- React Router
- Socket.io Client
- Supabase JS (auth + storage)
- Plain CSS

### Backend

- Node.js + Express
- Socket.io
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Auth (JWT verification)

## Project Structure

```
odin-messaging-app/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, ProtectedRoute
│   │   ├── context/          # AuthContext
│   │   ├── lib/              # Supabase client
│   │   ├── pages/            # Login, Signup, MyProfile, Friends, Messages
│   │   └── styles/           # CSS files per page
│   └── ...
├── backend/
│   ├── src/
│   │   ├── controllers/      # profileController, friendshipController, conversationController, messageController
│   │   ├── routes/           # profileRoutes, friendshipRoutes, conversationRoutes, messageRoutes
│   │   ├── middleware/       # authMiddleware
│   │   └── lib/              # prisma client, supabase client, socket
│   ├── prisma/
│   │   └── schema.prisma
│   ├── public/               # API docs landing page
│   └── app.js
└── README.md
```

## Database Schema

- **profiles** — User profile info linked to Supabase auth UUID
- **friendships** — Friend requests with `PENDING` / `ACCEPTED` status
- **conversations** — Container linking two participants
- **conversationparticipants** — Join table between profiles and conversations
- **messages** — Individual messages belonging to a conversation

## Getting Started

### Prerequisites

- Node.js
- A [Supabase](https://supabase.com) project

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
DATABASE_URL=your_supabase_session_pooler_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Run Prisma migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

Start the server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

## API Routes

| Method | Route                          | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| POST   | /api/profiles                  | Create profile after signup    |
| GET    | /api/profiles/me               | Get current user's profile     |
| PUT    | /api/profiles/me               | Update current user's profile  |
| GET    | /api/profiles/search?username= | Search users by username       |
| POST   | /api/friendships               | Send a friend request          |
| GET    | /api/friendships               | Get friends list               |
| GET    | /api/friendships/requests      | Get incoming friend requests   |
| PUT    | /api/friendships/:id/accept    | Accept a friend request        |
| DELETE | /api/friendships/:id/reject    | Reject a friend request        |
| DELETE | /api/friendships/:id           | Unfriend a user                |
| POST   | /api/conversations             | Find or create a conversation  |
| GET    | /api/conversations             | Get all conversations          |
| GET    | /api/messages/:conversationId  | Get messages in a conversation |

## WebSocket Events

| Event                  | Direction       | Description                              |
| ---------------------- | --------------- | ---------------------------------------- |
| `authenticate`         | Client → Server | Authenticate socket with Supabase JWT    |
| `authenticated`        | Server → Client | Confirms successful authentication       |
| `send_message`         | Client → Server | Send a message in a conversation         |
| `message_sent`         | Server → Client | Confirms message saved, echoes to sender |
| `receive_message`      | Server → Client | Delivers new message to recipient        |
| `conversation_updated` | Server → Client | Updates last message preview in sidebar  |

## Deployment

- **Backend** deployed on [Render](https://render.com)
  - Build command: `npm install && npx prisma generate`
  - Start command: `node app.js`
- **Frontend** deployed on [Render](https://render.com)

## Author

[curreesan](https://github.com/curreesan)
