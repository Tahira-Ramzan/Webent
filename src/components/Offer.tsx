import { useEffect, useState } from 'react';
import { offerRemainingMs, site } from '../config/site';

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; live: boolean };

function remaining(): Countdown {
  const diff = offerRemainingMs();
  if (!site.offer.enabled) return { days: 0, hours: 0, minutes: 0, seconds: 0, live: false };
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    live: true,
  };
}

/**
 * Counts down the current offer cycle.
 *
 * The clock is derived from the wall clock on every tick (`offerRemainingMs`),
 * so when it reaches 00:00:00 the next cycle starts immediately and the badge
 * carries on from the full value — the same for every visitor, with no stored
 * state and nothing to reset.
 */
export function useCountdown(): Countdown {
  const [state, setState] = useState<Countdown>(remaining);

  useEffect(() => {
    setState(remaining());
    const id = window.setInterval(() => setState(remaining()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return state;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** "80% off · Ends in 23:59:12" — restarts by itself when it hits zero. */
export function OfferBadge({ className = '' }: { className?: string }) {
  const { days, hours, minutes, seconds, live } = useCountdown();
  if (!site.offer.enabled || !live) return null;

  const label =
    days > 0
      ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <p className={`offer-badge ${className}`.trim()} role="note">
      <span className="offer-badge__off">{site.offer.label}</span>
      <span className="offer-badge__time">
        <span className="offer-badge__dot" aria-hidden="true" />
        Ends in <b>{label}</b>
      </span>
    </p>
  );
}
