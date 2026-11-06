import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { whatsappLink } from '../config/site';
import { ScrollProgress } from './ScrollProgress';
import { CursorCompanion } from './CursorCompanion';
import { WhatsAppIcon } from './Icons';
import { scrollToElement, scrollToPosition, useSmoothScroll } from '../hooks/useSmoothScroll';
import { useArrowBurst, useArrowCompass } from '../hooks/useMotion';

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Honour in-page anchors, otherwise start every route at the top.
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        scrollToElement(target);
        return;
      }
    }
    scrollToPosition(0);
  }, [pathname, search, hash]);

  return null;
}

/**
 * The floating WhatsApp pill hides itself while another call to action is on
 * screen, so it never sits on top of a button the visitor is trying to press.
 */
function useFabClearance(fabRef: React.RefObject<HTMLAnchorElement | null>) {
  useEffect(() => {
    const fab = fabRef.current;
    if (!fab) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-fab-clear]'));
    if (!targets.length) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.45) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        fab.classList.toggle('is-hidden', visible.size > 0);
      },
      { threshold: [0, 0.45, 0.75] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [fabRef]);
}

export function Layout() {
  const { pathname } = useLocation();
  const fabRef = useRef<HTMLAnchorElement>(null);
  useSmoothScroll();
  useArrowCompass();
  useArrowBurst();
  useFabClearance(fabRef);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      <ScrollProgress />
      <CursorCompanion />
      <Header />
      <main id="main" key={pathname} className="page-enter">
        {/* Route content re-mounts per path so entrance animation restarts cleanly. */}
        <Outlet />
      </main>
      <Footer />
      <a
        className="fab-wa"
        ref={fabRef}
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
      >
        <WhatsAppIcon />
        WhatsApp
      </a>
    </>
  );
}
