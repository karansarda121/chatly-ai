/** @type {import('tailwindcss').Config} */
export default {
  // Tells Tailwind which files to scan for class names, so it only
  // generates CSS for utilities we actually use (keeps the built CSS tiny).
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dark, WhatsApp/Telegram-inspired palette.
        // Referenced as e.g. bg-app-bg, bg-bubble-sent, text-app-text.
        app: {
          bg: '#0b141a', // near-black main background
          panel: '#111b21', // sidebar / header panel background
          panelAlt: '#202c33', // hover/alt panel surface
          border: '#2a3942', // subtle borders/dividers
          text: '#e9edef', // primary text on dark background
          textMuted: '#8696a0', // secondary/timestamp text
        },
        bubble: {
          sent: '#005c4b', // outgoing message bubble (teal/green accent)
          sentHover: '#026a56',
          received: '#202c33', // incoming message bubble (muted gray)
          ai: '#1f2c34', // distinct shade for AI assistant bubbles
        },
        accent: {
          DEFAULT: '#00a884', // primary teal/green accent (buttons, links, active states)
          hover: '#02997a',
        },
      },
    },
  },
  plugins: [],
}
