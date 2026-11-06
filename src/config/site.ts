/**
 * CENTRAL BUSINESS CONFIGURATION
 * ----------------------------------------------------------------------------
 * Everything business-specific lives here (and in shared/business.json, which the
 * server reads for validation, so the two can never disagree).
 * Change a price or contact detail here and it updates across every page.
 *
 * MISSING / TO CONFIRM BEFORE PUBLICATION:
 *   - business.name is taken from the supplied logo wordmark ("webent"); confirm
 *     the preferred capitalisation.
 *   - Social profiles, physical address and delivery timelines were NOT supplied,
 *     so they are deliberately absent from the site.
 */
import raw from '../../shared/business.json';

export type Service = {
  id: string;
  name: string;
  price: number;
  /** Price before the current offer. Shown struck through next to `price`. */
  wasPrice: number;
  /** Non-refundable registration fee, charged on top of `price`. */
  registrationFee: number;
  summary: string;
  description: string;
  visual: 'landing' | 'one-page' | 'multi-page';
  index: string;
};

const business = raw.business;

export const site = {
  name: business.name,
  /** Wordmark supplied by the owner — used exactly as provided. */
  logo: business.logoWordmark,
  logoSquare: business.logoSquare,
  email: business.email,
  whatsapp: {
    /** Full international number used to build wa.me links. */
    number: `${business.whatsapp.countryCode}${business.whatsapp.nationalNumber}`,
    display: business.whatsapp.display,
    /** Set to false to hide every WhatsApp entry point. */
    enabled: true,
  },
  currency: raw.currency.code,
  services: raw.services as Service[],
  /**
   * Rolling offer shown on the pricing cards.
   *
   * `mode: "rolling"` keeps the 80% badge on the site permanently: the clock is
   * a 24-hour cycle measured from `cycleAnchor`, so when it reaches 00:00:00 it
   * starts again from the full value on its own. Nothing is stored, nothing has
   * to be reset by hand. The discounted prices (`price`) are the current prices;
   * `wasPrice` is the reference figure that is struck through.
   *
   * Set `mode: "fixed"` to use the single `endsAt` date instead, or
   * `enabled: false` to remove every trace of the offer.
   */
  offer: {
    enabled: raw.offer.enabled,
    label: raw.offer.label,
    discountPercent: raw.offer.discountPercent,
    mode: (raw.offer.mode ?? 'rolling') as 'rolling' | 'fixed',
    cycleHours: raw.offer.cycleHours ?? 24,
    cycleAnchor: raw.offer.cycleAnchor ?? raw.offer.endsAt,
    endsAt: raw.offer.endsAt,
    note: raw.offer.note,
  },
  /** What every package includes, and what is deliberately not offered. */
  includes: {
    domain: raw.includes.domain,
    hosting: raw.includes.hosting,
    summary: raw.includes.summary,
    boundary: raw.includes.boundary,
    items: raw.includes.items as string[],
  },
  /** Public URL used for canonical tags. Override with VITE_SITE_URL at build time. */
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? '',
  /** Backend endpoint for inquiries (relative so it works on any host). */
  inquiryEndpoint: '/api/inquiries',
} as const;

export type SiteConfig = typeof site;

/** "PKR 3,000" */
export function formatPrice(amount: number): string {
  return `${site.currency} ${new Intl.NumberFormat('en-US').format(amount)}`;
}

export const services = site.services;

export function getService(id: string | null | undefined): Service | undefined {
  if (!id) return undefined;
  return site.services.find((service) => service.id === id);
}

/** Pre-filled WhatsApp link. The visitor still reviews and sends the message. */
export function whatsappLink(serviceId?: string | null): string {
  const service = getService(serviceId);
  const message = service
    ? `Hello ${site.name}, I am interested in your ${service.name} at ${formatPrice(
        service.price
      )} plus the ${formatPrice(service.registrationFee)} registration fee. I would like to discuss my website requirements.`
    : `Hello ${site.name}, I would like to discuss a website for my business.`;
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

/** Moment the current rolling offer cycle ends (always in the future). */
export function offerCycleEnd(now: number = Date.now()): number {
  if (site.offer.mode === 'fixed') {
    const ends = Date.parse(site.offer.endsAt);
    return Number.isFinite(ends) ? ends : now;
  }
  const cycleMs = Math.max(1, site.offer.cycleHours) * 3_600_000;
  const anchor = Date.parse(site.offer.cycleAnchor);
  const from = Number.isFinite(anchor) ? anchor : 0;
  const elapsed = now - from;
  const into = ((elapsed % cycleMs) + cycleMs) % cycleMs;
  return now - into + cycleMs;
}

/** Milliseconds left in the current offer cycle; wraps to a full cycle at zero. */
export function offerRemainingMs(now: number = Date.now()): number {
  return Math.max(0, offerCycleEnd(now) - now);
}

export function isOfferLive(now: number = Date.now()): boolean {
  if (!site.offer.enabled) return false;
  if (site.offer.mode === 'fixed') {
    const ends = Date.parse(site.offer.endsAt);
    return Number.isFinite(ends) ? ends > now : false;
  }
  // Rolling offer: live for as long as it is enabled.
  return offerCycleEnd(now) > now;
}

/**
 * The amount charged today. With the rolling offer that is always `price`
 * (the discounted figure); a fixed-date offer falls back to `wasPrice` once the
 * date passes.
 */
export function effectivePrice(service: Service, now: number = Date.now()): number {
  return isOfferLive(now) ? service.price : service.wasPrice;
}

/** Price + non-refundable registration fee. */
export function totalToStart(service: Service, now: number = Date.now()): number {
  return effectivePrice(service, now) + service.registrationFee;
}

export function mailtoLink(subject = 'Website inquiry'): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}

/** Path to the contact page with the given service pre-selected. */
export function inquiryPath(serviceId?: string): string {
  return serviceId ? `/contact?service=${encodeURIComponent(serviceId)}` : '/contact';
}

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
] as const;
