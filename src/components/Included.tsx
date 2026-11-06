import { site } from '../config/site';
import { CheckIcon } from './Icons';

type Props = {
  /** `paper` for the light sections, `dark` for the ink sections. */
  tone?: 'paper' | 'dark';
  className?: string;
  /** Hide the sentence and show only the ticks (used inside tight layouts). */
  compact?: boolean;
};

/**
 * What every package includes — and the boundary that matters: only free
 * hosting and a free domain are provided, never a paid plan.
 * Wording lives in shared/business.json so it stays identical everywhere.
 */
export function Included({ tone = 'dark', className = '', compact = false }: Props) {
  return (
    <div className={`included included--${tone} ${compact ? 'included--compact' : ''} ${className}`.trim()}>
      <ul className="included__list">
        {site.includes.items.map((item) => (
          <li key={item} className="included__item">
            <CheckIcon className="included__tick" />
            {item}
          </li>
        ))}
      </ul>
      {compact ? null : (
        <p className="included__note">
          {site.includes.summary} <strong>{site.includes.boundary}</strong>
        </p>
      )}
    </div>
  );
}
