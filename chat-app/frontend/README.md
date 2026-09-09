# Chatly AI Frontend

React and Vite client for Chatly AI.

## Commands

```bash
npm install
copy .env.example .env
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

```ini
VITE_API_BASE_URL=http://localhost:5000
```

Set `VITE_API_BASE_URL` to the deployed backend URL in production. It is used for REST API requests and the Socket.IO connection.

## Main areas

- Authentication and email verification screens
- Dashboard, chats, groups, contacts, and profile settings
- Real-time messages, presence, typing, and message status
- Media/document rendering and upload UI
- Chat-focused AI user interface

The production build is created in `dist/`, which is intentionally ignored by Git.