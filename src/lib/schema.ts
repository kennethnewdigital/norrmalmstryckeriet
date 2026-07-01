export const SITE_URL = 'https://norrmalmstryckeriet.se';
export const ORG_ID = SITE_URL + '/#organization';

export function serviceSchema(opts: {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType ?? 'Tryckproduktion',
    provider: { '@id': ORG_ID },
    areaServed: [
      { '@type': 'Place', name: 'Sollentuna' },
      { '@type': 'Place', name: 'Stockholm' },
    ],
    url: SITE_URL + opts.path,
  };
}

export function articleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: SITE_URL + opts.path,
    mainEntityOfPage: SITE_URL + opts.path,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    datePublished: opts.datePublished ?? '2026-06-01',
    dateModified: opts.dateModified ?? '2026-07-01',
  };
}

export function faqPageSchema(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function collectionPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: SITE_URL + opts.path,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: SITE_URL + it.path,
      })),
    },
  };
}

export function contactPageSchema(opts: { path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    url: SITE_URL + opts.path,
    about: { '@id': ORG_ID },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_URL + '/#website',
    url: SITE_URL,
    name: 'Norrmalmstryckeriet',
    publisher: { '@id': ORG_ID },
    inLanguage: 'sv-SE',
  };
}

export function graph(...schemas: object[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas.map((s) => {
      const { '@context': _ctx, ...rest } = s as { '@context'?: string };
      return rest;
    }),
  });
}
