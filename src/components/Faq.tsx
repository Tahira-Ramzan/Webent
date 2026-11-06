import { useState, type ReactNode } from 'react';

export type FaqEntry = {
  question: string;
  answer: ReactNode;
};

type Props = {
  items: FaqEntry[];
  paper?: boolean;
  idPrefix: string;
};

/** Accessible disclosure list — one item open at a time, fully keyboard operable. */
export function Faq({ items, paper = false, idPrefix }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={`faq ${paper ? 'faq--paper' : ''}`}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const buttonId = `${idPrefix}-q${index}`;
        const panelId = `${idPrefix}-a${index}`;

        return (
          <div className="faq__item" key={item.question}>
            <h3>
              <button
                className="faq__button"
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="faq__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="faq__question">{item.question}</span>
                <span className="faq__icon" aria-hidden="true" />
              </button>
            </h3>
            <div className="faq__panel" id={panelId} role="region" aria-labelledby={buttonId} data-open={open}>
              <div>
                <div className="faq__answer">
                  <span className="faq__mark" aria-hidden="true">
                    A
                  </span>
                  <div className="faq__answer-body">{item.answer}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
