/**
 * Full-page atmospheric background: Manila street photo from Unsplash + scrim + aurora accents.
 */
export function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden>
      <div className="site-bg__photo site-bg__photo--primary" />
      <div className="site-bg__photo site-bg__photo--secondary" />
      <div className="site-bg__scrim" />
      <div className="site-bg__grain" />
      <div className="aurora-bg" />
    </div>
  );
}
