import { effectivePrice, formatPrice, isOfferLive, totalToStart, type Service } from '../config/site';
import { useCountUp } from '../hooks/useMotion';

type Props = {
  service: Service;
  /** Counting animation is only worth it on the big pricing cards. */
  countUp?: boolean;
  className?: string;
};

/**
 * Price block shared by the service cards, the pricing cards and the services
 * page. Shows the current price, the struck-through price while the offer is
 * live, and the non-refundable registration fee charged on top.
 */
export function PriceBlock({ service, countUp = false, className = '' }: Props) {
  const { ref, value } = useCountUp(service.price, 780);
  const offerLive = isOfferLive();
  const charge = effectivePrice(service);
  const total = totalToStart(service);

  return (
    <div className={`price-block ${className}`.trim()}>
      {offerLive ? (
        <p className="price-block__was-row">
          <s className="price-block__was">
            <span className="sr-only">Standard price </span>
            {formatPrice(service.wasPrice)}
          </s>
        </p>
      ) : null}

      <p className="price-block__row">
        <span className="price-block__now">
          <span className="price__currency">{formatPrice(charge).split(' ')[0]}</span>
          <span className="price__amount" ref={countUp ? ref : undefined}>
            {countUp ? (
              <>
                <span aria-hidden="true">{new Intl.NumberFormat('en-US').format(value)}</span>
                <span className="sr-only">{new Intl.NumberFormat('en-US').format(charge)}</span>
              </>
            ) : (
              new Intl.NumberFormat('en-US').format(charge)
            )}
          </span>
        </span>
      </p>

      <p className="price-block__fee">
        + {formatPrice(service.registrationFee)} registration fee, non-refundable
      </p>
      <p className="price-block__total">
        <span>Total to start</span>
        <b>{formatPrice(total)}</b>
      </p>
    </div>
  );
}
