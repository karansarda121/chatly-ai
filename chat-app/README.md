# Chatly AI

Chatly AI is a full-stack, real-time messaging application. It supports private and group conversations, media and document sharing, account security, and optional AI assistance inside chats.

## Features

- Email OTP verification, login, password reset, and profile management
- Private chats, group chats, contacts, member roles, and blocking
- Real-time messages, online presence, typing indicators, reactions, replies, forwarding, pins, saved messages, edits, and read status
- Chat search and paginated message history
- Image, video, PDF, and document uploads through ImageKit
- Upload progress, cancellation, retry, previews, and downloads
- AI Catch Up, Ask This Chat, translation, smart replies, explanations, and task follow-ups
- Responsive light and dark themes

## Architecture

```text
React + Vite frontend
        |
        | HTTP requests and Socket.IO events
        v
Express + Socket.IO backend
        |
        | Mongoose
        v
MongoDB

External services: SMTP (email), ImageKit (file storage), Gemini (AI features)
```

## Project structure

```text
chat-app/
  frontend/       React client
  backend/        Express, Socket.IO, and MongoDB API
  README.md       This guide
```

## Requirements

- Node.js 18 or newer
- MongoDB connection string
- SMTP account for verification and password-reset email
- ImageKit credentials for uploads
- Gemini API key for AI features

## Local setup

Install and run the backend in one terminal:

```bash
cd chat-app/backend
npm install
copy .env.example .env
npm run dev
```

Install and run the frontend in another terminal:

```bash
cd chat-app/frontend
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Environment variables


```bash
cd chat-app/backend
copy .env.example .env

cd ../frontend
copy .env.example .env
```

### Backend `.env`

| Variable | What to add |
| --- | --- |
| `PORT` | Backend port, normally `5000` |
| `CLIENT_URL` | Frontend URL, such as `http://localhost:5173` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | A long random private secret |
| `JWT_EXPIRES_IN` | Login-token lifetime, such as `7d` |
| `MAX_FILE_SIZE_MB` | Maximum upload size in MB |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL endpoint |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key |
| `BREVO_API_KEY` | Brevo transactional-email API key |
| `BREVO_SENDER_EMAIL` | Verified sender email address in Brevo |
| `BREVO_SENDER_NAME` | Friendly sender name, such as `Chatly AI` |
| `GEMINI_API_KEY` | Gemini API key for product AI features |
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` | Gemini text model names |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model name |
| `AI_RATE_LIMIT_PER_HOUR` | Maximum AI requests per user per hour |

### Frontend `.env`

| Variable | What to add |
| --- | --- |
| `VITE_API_BASE_URL` | Backend URL; locally `http://localhost:5000` |

For local development, `CLIENT_URL` must match the frontend URL and `VITE_API_BASE_URL` must match the backend URL.

## Useful commands

```bash
# Frontend quality checks
cd chat-app/frontend
npm run lint
npm run build

# Backend production start
cd chat-app/backend
npm start
```

