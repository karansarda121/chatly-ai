# Chatly AI Backend

Express, Socket.IO, and MongoDB API for Chatly AI.

## Commands

```bash
npm install
copy .env.example .env
npm run dev
npm start
```

## Environment

Copy `.env.example` to `.env` and provide real values for MongoDB, JWT, SMTP, ImageKit, and Gemini. Do not commit `.env`.

## API groups

- `/api/health` - health check
- `/api/auth` - registration, verification, login, and password reset
- `/api/chats` - private and group chats
- `/api/messages` - messages and message actions
- `/api/uploads` - media and file uploads
- `/api/users` - contacts, profiles, and user actions
- `/api/saved-messages` - saved messages
- `/api/work-items` - assignment/work-item support
- `/api/ai` - user-facing AI features

## Services

- MongoDB + Mongoose for persistent data
- Socket.IO for real-time chat events
- Nodemailer SMTP for OTP and password-reset email
- ImageKit for media/document storage
- Gemini API for AI-assisted product features

`CLIENT_URL` controls which frontend origin may access the API and Socket.IO server. Set it to your deployed frontend URL in production.