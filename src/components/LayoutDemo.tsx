import { useState, type ReactNode } from 'react';

type Variant = 'landing' | 'one-page' | 'multi-page';

type Props = {
  variant: Variant;
  className?: string;
  caption?: { em: string; text: string };
  /** Start with the narrow preview selected. */
  startMobile?: boolean;
};

const FIG: Record<Variant, string> = {
  landing: 'FIG. A',
  'one-page': 'FIG. B',
  'multi-page': 'FIG. C',
};

const NAME: Record<Variant, string> = {
  landing: 'Landing page',
  'one-page': 'One-page site',
  'multi-page': 'Multi-page site',
};

/**
 * The layout drawing.
 *
 * A page is drawn the way a studio pins one up: a sheet of paper on a dark
 * board, hairline registration marks, a mono specimen line, and the page itself
 * built from real type, hairlines, a hatched image plate and one lime action.
 * The blocks are labelled only while you point at them, so the drawing stays
 * quiet at rest. Nothing here is a screenshot of client work.
 */
export function LayoutDemo({ variant, className = '', caption, startMobile = false }: Props) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>(startMobile ? 'mobile' : 'desktop');
  const [tab, setTab] = useState(0);
  const tabs = ['Home', 'Services', 'Contact'];

  return (
    <figure className={`demo demo--${variant} demo--${mode} ${className}`.trim()}>
      <div className="demo__board">
        <span className="demo__mark demo__mark--tl" aria-hidden="true" />
        <span className="demo__mark demo__mark--tr" aria-hidden="true" />
        <span className="demo__mark demo__mark--bl" aria-hidden="true" />
        <span className="demo__mark demo__mark--br" aria-hidden="true" />

        <div className="demo__head">
          <span className="demo__fig">{FIG[variant]}</span>
          <span className="demo__fig-name">{NAME[variant]}</span>
          <div className="demo__toggle" role="group" aria-label="Preview width">
            <button
              type="button"
              aria-pressed={mode === 'desktop'}
              onClick={() => setMode('desktop')}
              className={mode === 'desktop' ? 'is-on' : ''}
            >
              Wide
            </button>
            <button
              type="button"
              aria-pressed={mode === 'mobile'}
              onClick={() => setMode('mobile')}
              className={mode === 'mobile' ? 'is-on' : ''}
            >
              Narrow
            </button>
          </div>
        </div>

        <div className="demo__stage">
          <div className="demo__screen">
            <span className="demo__scanline" aria-hidden="true" />

            <div className="demo__bar">
              <span className="demo__bar-ticks" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="demo__bar-url">
                <span className="demo__bar-lock" aria-hidden="true" />
                your-site
              </span>
            </div>

            <div className="demo__sheet">
              {variant !== 'landing' ? (
                <nav className="demo__nav" aria-label="Demo navigation">
                  <span className="demo__brand" aria-hidden="true">
                    <span className="demo__brand-glyph" />
                    <span className="demo__brand-word" />
                  </span>
                  <ul>
                    {tabs.map((label, index) => (
                      <li key={label}>
                        {variant === 'multi-page' ? (
                          <button
                            type="button"
                            className={tab === index ? 'is-on' : ''}
                            aria-current={tab === index ? 'page' : undefined}
                            onClick={() => setTab(index)}
                          >
                            {label}
                          </button>
                        ) : (
                          <span className={index === 0 ? 'is-on' : ''}>{label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}

              {variant === 'landing' ? (
                <div className="demo__split">
                  <div className="demo__col">
                    <Zone label="Headline">
                      <p className="demo__kicker">Landing page</p>
                      <h4 className="demo__h">
                        One message,
                        <br />
                        one action.
                      </h4>
                    </Zone>
                    <Zone label="Supporting line">
                      <p className="demo__p">A sentence that removes the doubt, then gets out of the way.</p>
                    </Zone>
                    <Zone label="Buttons">
                      <p className="demo__buttons">
                        <span className="demo__btn demo__btn--fill">
                          Get in touch
                          <i aria-hidden="true" />
                        </span>
                        <span className="demo__btn">See more</span>
                      </p>
                    </Zone>
                  </div>
                  <Zone label="Media" className="demo__media">
                    <span className="demo__plate" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </Zone>
                </div>
              ) : null}

              {variant === 'one-page' ? (
                <div className="demo__stack">
                  <Zone label="Headline">
                    <h4 className="demo__h">Everything on one page.</h4>
                    <p className="demo__p">Sections follow each other as the visitor scrolls.</p>
                  </Zone>
                  <Zone label="Sections">
                    <div className="demo__cards">
                      {[
                        ['01', 'Who we are', 'Two lines of introduction.'],
                        ['02', 'What we do', 'Three services, named.'],
                        ['03', 'Talk to us', 'Contact details and a form.'],
                      ].map(([num, title, text]) => (
                        <span className="demo__card" key={title}>
                          <b>{num}</b>
                          <strong>{title}</strong>
                          <i>{text}</i>
                        </span>
                      ))}
                    </div>
                  </Zone>
                  <Zone label="Closing action">
                    <p className="demo__band">
                      <span className="demo__band-type">
                        Start a
                        <br />
                        conversation
                      </span>
                      <span className="demo__band-arrow" aria-hidden="true" />
                    </p>
                  </Zone>
                </div>
              ) : null}

              {variant === 'multi-page' ? (
                <div className="demo__stack demo__stack--pages">
                  <Zone label="Page content">
                    {tab === 0 ? (
                      <div className="demo__panel" key="home">
                        <p className="demo__kicker">Home</p>
                        <h4 className="demo__h">
                          A whole page
                          <br />
                          for the first look.
                        </h4>
                        <p className="demo__p">Navigation stays visible, so every other page is one click away.</p>
                      </div>
                    ) : null}
                    {tab === 1 ? (
                      <div className="demo__panel" key="services">
                        <p className="demo__kicker">Services</p>
                        <div className="demo__cards demo__cards--rows">
                          {[
                            ['01', 'Landing page', 'One purpose'],
                            ['02', 'One-page site', 'All sections'],
                            ['03', 'Multi-page site', 'Room to grow'],
                          ].map(([num, title, text]) => (
                            <span className="demo__card" key={title}>
                              <b>{num}</b>
                              <strong>{title}</strong>
                              <i>{text}</i>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {tab === 2 ? (
                      <div className="demo__panel" key="contact">
                        <p className="demo__kicker">Contact</p>
                        <h4 className="demo__h">Name, email, one button.</h4>
                        <p className="demo__field" aria-hidden="true">
                          <span />
                          <span />
                          <span className="demo__field--tall" />
                        </p>
                        <p className="demo__buttons">
                          <span className="demo__btn demo__btn--fill">
                            Send
                            <i aria-hidden="true" />
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </Zone>
                  <p className="demo__hint">Pick a page in the navigation above</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <figcaption className="demo__caption">
          <em>{caption?.em ?? 'Layout drawing'}</em>
          <span>{caption?.text ?? 'Not a client project'}</span>
        </figcaption>
      </div>
    </figure>
  );
}

function Zone({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`dz ${className}`.trim()} tabIndex={0} data-zone={label}>
      {children}
      <span className="dz__tag">{label}</span>
    </div>
  );
}
