import { Link } from 'react-router-dom';
import { inquiryPath, whatsappLink, type Service } from '../config/site';
import { Reveal } from './Reveal';
import { PriceBlock } from './PriceBlock';
import { OfferBadge } from './Offer';
import { useTilt } from '../hooks/useMotion';
import { ArrowUpRight, WhatsAppIcon } from './Icons';

type Props = {
  service: Service;
  index?: number;
  /** Show the pre-filled WhatsApp option next to the select button. */
  showWhatsApp?: boolean;
};

export function ServiceCard({ service, index = 0, showWhatsApp = true }: Props) {
  const tiltRef = useTilt<HTMLElement>(4);

  return (
    <Reveal as="article" className="service-card tilt" delay={index} variant="scale" innerRef={tiltRef}>
      <div className="service-card__top">
        <span className="service-card__index">{service.index} / SERVICE</span>
        <OfferBadge className="offer-badge--mini" />
      </div>
      <h3 className="service-card__title">{service.name}</h3>
      <p className="service-card__desc">{service.summary}</p>
      <PriceBlock service={service} className="service-card__price" />
      <div className="service-card__actions">
        <Link className="btn btn--lime" to={inquiryPath(service.id)}>
          Select
          <ArrowUpRight className="btn__arrow" />
        </Link>
        {showWhatsApp ? (
          <a
            className="btn btn--ghost"
            href={whatsappLink(service.id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask about the ${service.name} on WhatsApp`}
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        ) : null}
      </div>
    </Reveal>
  );
}
