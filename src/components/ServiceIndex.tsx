import { Link } from 'react-router-dom';
import { inquiryPath, site, type Service } from '../config/site';
import { ArrowUpRight } from './Icons';

/**
 * The service index in chapter 02.
 *
 * Deliberately price-free: the amounts live in the pricing chapter, so the
 * home page never shows two price tables. Each row is one line, with an arrow
 * that leads to the form with that service already selected.
 */
export function ServiceIndex() {
  return (
    <ol className="index-list">
      {site.services.map((service: Service) => (
        <li className="index-row" key={service.id}>
          <Link className="index-row__link" to={inquiryPath(service.id)}>
            <span className="index-row__num">{service.index}</span>
            <span className="index-row__name">{service.name}</span>
            <span className="index-row__desc">{service.summary}</span>
            <span className="index-row__arrow" aria-hidden="true">
              <ArrowUpRight />
              <ArrowUpRight className="index-row__arrow-ghost" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
