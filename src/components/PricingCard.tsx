import { Link } from 'react-router-dom';
import { inquiryPath, site, whatsappLink, type Service } from '../config/site';
import { Reveal } from './Reveal';
import { PriceBlock } from './PriceBlock';
import { OfferBadge } from './Offer';
import { useTilt } from '../hooks/useMotion';
import { ArrowUpRight, WhatsAppIcon } from './Icons';

type Props = {
  service: Service;
  index?: number;
  paper?: boolean;
  /** Detail-page copy is slightly longer than the card summary. */
  description?: string;
  note?: string;
};

export function PricingCard({ service, index = 0, paper = false, description, note }: Props) {
  const tiltRef = useTilt<HTMLElement>(4);

  return (
    <Reveal
      as="article"
      className={`price-card tilt ${paper ? 'price-card--paper' : ''}`}
      delay={index}
      variant="scale"
      innerRef={tiltRef}
    >
      <OfferBadge className="price-card__offer" />

      <div className="price-card__head">
        <h3 className="price-card__name">{service.name}</h3>
        <p className="price-card__desc">{description ?? service.summary}</p>
      </div>

      <PriceBlock service={service} countUp className="price-card__figure" />

      <p className="price-card__includes">
        <span>{site.includes.domain}</span>
        <span>{site.includes.hosting}</span>
      </p>

      {note ? <p className="price-card__note">{note}</p> : null}

      <div className="price-card__actions" data-fab-clear>
        <Link
          className={paper ? 'btn btn--ink' : 'btn btn--lime'}
          to={inquiryPath(service.id)}
        >
          Select this package
          <ArrowUpRight className="btn__arrow" />
        </Link>
        <a
          className={paper ? 'btn btn--outline-ink' : 'btn btn--ghost'}
          href={whatsappLink(service.id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          Discuss on WhatsApp
        </a>
      </div>
    </Reveal>
  );
}
