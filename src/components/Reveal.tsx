import {
  createElement,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type Ref,
} from 'react';

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  variant?: 'up' | 'fade' | 'left' | 'right' | 'scale';
  /** Stagger step (multiplied by 90ms in CSS). */
  delay?: number;
  className?: string;
  /** Optional ref (used for pointer tilt). */
  innerRef?: Ref<HTMLElement>;
};

/** Wrapper that opts an element into the shared scroll-reveal observer. */
export function Reveal({
  children,
  as = 'div',
  variant = 'up',
  delay = 0,
  className,
  innerRef,
}: RevealProps) {
  return createElement(
    as,
    {
      className,
      ref: innerRef,
      'data-reveal': variant,
      style: delay ? ({ '--reveal-delay': delay } as CSSProperties) : undefined,
    },
    children
  );
}
