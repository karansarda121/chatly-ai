import './FeatureCard.css';

function FeatureCard({ icon: Icon, title, children }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">
        <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

export default FeatureCard;
