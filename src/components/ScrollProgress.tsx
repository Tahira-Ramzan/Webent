import { useScrollProgress } from '../hooks/useMotion';

/** Thin lime line at the very top showing reading progress. */
export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div className="progress" aria-hidden="true">
      <div className="progress__bar" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
