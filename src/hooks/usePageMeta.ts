import { useEffect } from 'react';
import { site } from '../config/site';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Per-page title, description, canonical and social tags. */
export function usePageMeta(title: string, description: string, path: string, noIndex = false) {
  useEffect(() => {
    const fullTitle = path === '/' ? title : `${title} — ${site.name}`;
    document.title = fullTitle;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    if (site.url) {
      const canonical = `${site.url}${path === '/' ? '/' : path}`;
      setCanonical(canonical);
      setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    }
  }, [title, description, path, noIndex]);
}
