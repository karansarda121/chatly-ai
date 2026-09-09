import {
  ArrowRight,
  Bot,
  CheckCheck,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import FeatureCard from './FeatureCard.jsx';
import useAuth from '../hooks/useAuth.js';
import './LandingPage.css';

function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a href="#top" className="landing-brand" aria-label="Chatly AI home">
          <span className="brand-icon">
            <MessageCircle size={22} aria-hidden="true" />
          </span>
          <span>Chatly<span className="accent-text">AI</span></span>
        </a>

        <nav className="landing-actions" aria-label="Account actions">
          {user ? (
            <>
              <Link to="/app" className="button button-primary">Open Chatly</Link>
              <button type="button" className="button button-login" onClick={logout}><LogOut size={16} /> Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button-login">Log in</Link>
              <Link to="/register" className="button button-primary">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="hero-badge">
              <Sparkles size={15} aria-hidden="true" /> Messaging, made more thoughtful
            </p>
            <h1 className="hero-title">
              Chat smarter. <span className="accent-text">Stay connected.</span>
            </h1>
            <p className="hero-description">
              Private real-time messaging for friends, teams, and communities—plus an AI assistant that helps you catch up and reply with confidence.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link to="/app" className="button button-primary button-with-icon">
                  Open your conversations <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="button button-primary button-with-icon">
                    Create your account <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="button button-secondary">I already have an account</Link>
                </>
              )}
            </div>
            <p className="privacy-note">
              <ShieldCheck size={16} aria-hidden="true" /> Your AI conversations stay private to you.
            </p>
          </div>

          <div className="chat-preview" aria-label="Chat interface preview">
            <div className="preview-header">
              <div className="preview-avatar"><Bot size={20} aria-hidden="true" /></div>
              <div className="preview-title"><p>AI Assistant</p><p className="preview-subtitle">Private and ready to help</p></div>
              <span className="preview-status" aria-label="Online" />
            </div>
            <div className="preview-messages">
              <div className="message-bubble message-received">Can you catch me up on the Team Alpha chat?</div>
              <div className="message-bubble message-ai">
                <p>Here is what you missed:</p>
                <ul className="mt-2 space-y-1 text-app-textMuted"><li>• Launch moved to Friday</li><li>• Review onboarding flow</li><li>• One decision remains</li></ul>
              </div>
              <div className="preview-note"><CheckCheck size={15} aria-hidden="true" /> Private assistant reply</div>
            </div>
            <div className="preview-composer"><MessageCircle size={18} aria-hidden="true" /> Ask anything...</div>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-features-content">
            <div className="feature-intro"><p className="eyebrow">Built for real conversations</p><h2 className="feature-heading">Everything you need to keep conversations moving.</h2></div>
            <div className="feature-grid">
              <FeatureCard icon={MessageCircle} title="Real-time chat">Messages, typing states, and read receipts update when they happen.</FeatureCard>
              <FeatureCard icon={UsersRound} title="Groups & communities">Keep friends, teams, and shared interests organized in one place.</FeatureCard>
              <FeatureCard icon={Bot} title="Private AI help">Summarize a chat or draft a reply without exposing it to anyone else.</FeatureCard>
              <FeatureCard icon={ShieldCheck} title="Designed for privacy">Your private assistant conversation is separate from every shared chat.</FeatureCard>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2026 ChatlyAI. Thoughtful conversations, in real time.</p>
        <p>React · Node.js · MongoDB · Socket.io · ImageKit</p>
      </footer>
    </div>
  );
}

export default LandingPage;
