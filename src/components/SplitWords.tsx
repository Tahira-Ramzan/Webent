import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';

export type Segment = { text: string; accent?: boolean; ink?: boolean };

type SplitWordsProps = {
  segments: Segment[];
  as?: ElementType;
  className?: string;
  /** Extra delay before the first word, in ms (mount-driven variants). */
  delay?: number;
  /** Reveal on scroll instead of on mount. */
  onScroll?: boolean;
  style?: CSSProperties;
};

type Word = { text: string; accent: boolean; ink: boolean };

/**
 * Word-by-word masked headline reveal.
 *
 * Each word sits in an overflow-hidden mask and rises out of the line, one after
 * another. Words are inline blocks, so the headline still wraps naturally at
 * every viewport width — no fixed line breaks, no layout shift, no library.
 *
 * Word gaps are margins on the masks, not text spaces: a text node at the end of
 * an inline-block would be trimmed, which collapses the spacing between words.
 */
export function SplitWords({
  segments,
  as = 'h2',
  className,
  delay = 0,
  onScroll = false,
  style,
}: SplitWordsProps) {
  const words: Word[] = [];
  segments.forEach((segment) => {
    segment.text
      .split(' ')
      .filter(Boolean)
      .forEach((text) => words.push({ text, accent: Boolean(segment.accent), ink: Boolean(segment.ink) }));
  });

  const content: ReactNode[] = words.map((word, index) => {
    const next = words[index + 1];
    const isLast = index === words.length - 1;
    const gapClass = isLast ? '' : next?.accent || next?.ink ? 'w-mask--gap-lg' : 'w-mask--gap';
    const accentClass = word.ink ? 'accent accent--ink' : word.accent ? 'accent' : '';

    return (
      <span className={`w-mask ${gapClass}`.trim()} key={`${index}-${word.text}`}>
        <span
          className={`w-inner ${accentClass}`.trim()}
          style={{ '--i': index, '--d': `${delay}ms` } as CSSProperties}
        >
          {word.text}
        </span>
      </span>
    );
  });

  return createElement(
    as,
    {
      className: `words ${onScroll ? 'words--scroll' : 'words--now'} ${className ?? ''}`.trim(),
      ...(onScroll ? { 'data-reveal': 'words' } : {}),
      style,
    },
    content
  );
}
