import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

/*
 * Reveal animations are opt-in: the hidden state only exists once this class is
 * present, so if JavaScript or IntersectionObserver fails, every section stays
 * visible and readable.
 */
if (
  typeof IntersectionObserver !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  document.documentElement.classList.add('has-reveal');
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
