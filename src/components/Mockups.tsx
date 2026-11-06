import type { Service } from '../config/site';

type BrowserProps = {
  variant: Service['visual'];
  label: string;
  /** Accessible description of the illustration. */
  alt: string;
  paper?: boolean;
  className?: string;
};

/**
 * Original, purely illustrative browser mockup rendered with CSS.
 * These are layout illustrations only — not screenshots of client projects.
 */
export function BrowserMockup({ variant, label, alt, paper = false, className = '' }: BrowserProps) {
  return (
    <div
      className={`browser browser--${variant} ${paper ? 'browser--paper' : ''} ${className}`}
      role="img"
      aria-label={alt}
    >
      <div className="browser__bar">
        <div className="browser__dots">
          <i />
          <i />
          <i />
        </div>
        <div className="browser__url">{label}</div>
      </div>
      <div className="browser__body">
        <div className="mock-nav">
          <span className="mock-mark" />
          <span className="mock-navlinks">
            {variant === 'multi-page' ? <i /> : null}
            <i />
            <i />
            {variant !== 'landing' ? <i /> : null}
          </span>
          <span className="mock-pill" />
        </div>

        {variant === 'landing' ? (
          <>
            <div className="mock-hero">
              <div className="mock-copy">
                <span className="mock-line mock-line--xl" />
                <span className="mock-line mock-line--accent" />
                <span className="mock-line mock-line--sm" />
                <div className="mock-cta">
                  <i />
                  <i />
                </div>
              </div>
              <div className="mock-visual" />
            </div>
            <div className="mock-footer">
              <i />
              <i />
              <i />
            </div>
          </>
        ) : null}

        {variant === 'one-page' ? (
          <>
            <div className="mock-hero">
              <div className="mock-copy">
                <span className="mock-line mock-line--xl" />
                <span className="mock-line mock-line--accent" />
                <span className="mock-line mock-line--sm" />
                <div className="mock-cta">
                  <i />
                  <i />
                </div>
              </div>
              <div className="mock-visual mock-visual--alt" />
            </div>
            <div className="mock-cards">
              {[0, 1, 2].map((card) => (
                <div className="mock-card" key={card}>
                  <i />
                  <i />
                  <i />
                  <i />
                  <span className="mock-card__btn" />
                </div>
              ))}
            </div>
            <div className="mock-footer">
              <i />
              <i />
              <i />
            </div>
          </>
        ) : null}

        {variant === 'multi-page' ? (
          <>
            <div className="mock-hero">
              <div className="mock-copy">
                <span className="mock-line mock-line--xl" />
                <span className="mock-line mock-line--accent" />
                <span className="mock-line mock-line--sm" />
                <span className="mock-line mock-line--sm" />
              </div>
              <div className="mock-visual" />
            </div>
            <div className="mock-grid">
              <div className="mock-tile" />
              <div className="mock-tile mock-tile--accent" />
              <div className="mock-tile mock-tile--accent" />
              <div className="mock-tile" />
            </div>
            <div className="mock-footer">
              <i />
              <i />
              <i />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function PhoneMockup({ alt, paper = false }: { alt: string; paper?: boolean }) {
  return (
    <div className={`phone ${paper ? 'phone--paper' : ''}`} role="img" aria-label={alt}>
      <div className="phone__screen">
        <div className="phone__notch" />
        <div className="mock-nav">
          <span className="mock-mark" />
          <span className="mock-pill" />
        </div>
        <div className="mock-visual mock-visual--alt" />
        <div className="mock-copy">
          <span className="mock-line mock-line--xl" />
          <span className="mock-line mock-line--sm" />
          <div className="mock-cta">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
