/**
 * Two stacked copies of the same label. The top one rises out and the second
 * slides up behind it on hover — the "duplicated label" move, done with CSS
 * only and no duplicated text for screen readers.
 */
export function SwapLabel({ text }: { text: string }) {
  return (
    <span className="swap">
      <span className="swap__line swap__line--a">{text}</span>
      <span className="swap__line swap__line--b" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
