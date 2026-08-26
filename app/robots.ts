import type { MetadataRoute } from 'next';

const siteUrl = 'https://govind-turkar-portfolio.turkargovind3.chatgpt.site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
